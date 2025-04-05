import pytest
import base64
from src.app.services.order.order_processor import OrderProcessor


@pytest.fixture
def sample_audio_data():
    """Create sample audio data for testing."""
    # Create a minimal WAV file
    wav_data = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    return base64.b64encode(wav_data).decode("utf-8")


@pytest.fixture
async def order_processor():
    """Create OrderProcessor with real dependencies."""
    processor = OrderProcessor()
    yield processor


@pytest.mark.asyncio
async def test_complete_order_flow(test_client, sample_audio_data, order_processor):
    """Test the complete order flow from creation to confirmation."""
    # 1. Create order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
    order_data = response.json()
    order_id = order_data["order_id"]

    # Verify order was created correctly
    assert order_data["transcription"] is not None
    assert order_data["processed_order"] is not None
    assert order_data["success"] is True

    # 2. Get table orders to verify order is listed
    response = await test_client.get("/api/orders/table/1")
    assert response.status_code == 200
    table_orders = response.json()
    assert len(table_orders) == 1
    assert table_orders[0]["id"] == order_id

    # 3. Confirm order
    response = await test_client.post(
        f"/orders/{order_id}/confirm", json={"confirmed": True}
    )
    assert response.status_code == 200
    confirmed_order = response.json()
    assert confirmed_order["status"] == "confirmed"

    # 4. Verify order status in table orders
    response = await test_client.get("/orders/table/1")
    assert response.status_code == 200
    table_orders = response.json()
    assert table_orders[0]["status"] == "confirmed"


@pytest.mark.asyncio
async def test_order_cancellation_flow(test_client, sample_audio_data, order_processor):
    """Test the order cancellation flow."""
    # 1. Create order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
    order_data = response.json()
    order_id = order_data["order_id"]

    # 2. Cancel order
    response = await test_client.post(
        f"/orders/{order_id}/confirm", json={"confirmed": False}
    )
    assert response.status_code == 200
    cancelled_order = response.json()
    assert cancelled_order["status"] == "cancelled"

    # 3. Verify order status in table orders
    response = await test_client.get("/orders/table/1")
    assert response.status_code == 200
    table_orders = response.json()
    assert table_orders[0]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_multiple_orders_flow(test_client, sample_audio_data, order_processor):
    """Test handling multiple orders for the same table."""
    # 1. Create first order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
    first_order = response.json()

    # 2. Create second order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
    second_order = response.json()

    # 3. Verify both orders are listed
    response = await test_client.get("/orders/table/1")
    assert response.status_code == 200
    table_orders = response.json()
    assert len(table_orders) == 2

    # 4. Confirm first order
    response = await test_client.post(
        f"/orders/{first_order['order_id']}/confirm", json={"confirmed": True}
    )
    assert response.status_code == 200

    # 5. Cancel second order
    response = await test_client.post(
        f"/orders/{second_order['order_id']}/confirm", json={"confirmed": False}
    )
    assert response.status_code == 200

    # 6. Verify final states
    response = await test_client.get("/orders/table/1")
    assert response.status_code == 200
    table_orders = response.json()
    order_states = {order["id"]: order["status"] for order in table_orders}
    assert order_states[first_order["order_id"]] == "confirmed"
    assert order_states[second_order["order_id"]] == "cancelled"


@pytest.mark.asyncio
async def test_error_recovery_flow(test_client, sample_audio_data, order_processor):
    """Test error handling and recovery."""
    # 1. Create order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
    order_data = response.json()
    order_id = order_data["order_id"]

    # 2. Try to confirm non-existent order (should fail gracefully)
    response = await test_client.post(
        "/orders/999999/confirm", json={"confirmed": True}
    )
    assert response.status_code == 404

    # 3. Verify original order is still accessible
    response = await test_client.get(f"/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["id"] == order_id


@pytest.mark.asyncio
async def test_rate_limit_recovery_flow(
    test_client, sample_audio_data, order_processor
):
    """Test rate limiting and recovery."""
    # 1. Create initial order
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200

    # 2. Hit rate limit
    for _ in range(10):  # Assuming rate limit is set to 5 requests per window
        response = await test_client.post(
            "/orders/voice", json={"audio_data": sample_audio_data}
        )
        if response.status_code == 429:  # Rate limit hit
            break

    # 3. Try to create order again (should succeed)
    response = await test_client.post(
        "/orders/voice", json={"audio_data": sample_audio_data}
    )
    assert response.status_code == 200
