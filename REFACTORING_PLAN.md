# Backend Refactoring Plan

This plan outlines the steps to refactor the FastAPI backend (`/Users/mike/plate-order-system`) to address structural issues, schema inconsistencies, and ID type mismatches, aiming for consistency and adherence to best practices.

**Source of Truth:** Database models (`app/db/models/*.py`) are considered the source of truth, especially for primary key types (which appear to be predominantly `Integer`).

## Plan Steps:

1.  **Correct Central Schemas (`app/api/v1/schemas.py`):**
    *   Modify schemas (`TableInDB`, `Table`, `OrderInDB`, `Order`, etc.) to use the correct primary key type (`id: int`) based on their corresponding database models.
    *   Verify and correct ID types (`int` vs `str`) for all other schemas (`Seat`, `FloorPlan`, `Resident`) in this file based on their models.

2.  **Correct Repositories (`app/db/repositories/*.py`):**
    *   **`orders.py`:** Change `id` parameter/usage from `str` to `int` in methods like `get`, `update`, `remove`, `update_status`.
    *   **`tables.py`:** Ensure `table_id` parameter/usage is `int` (already correct).
    *   Verify and correct ID types (`int` vs `str`) in method parameters and internal usage for all other repositories (`seats.py`, `floor_plans.py`, etc.) based on the corresponding models.

3.  **Refactor Endpoints (`app/api/v1/endpoints/*.py`):**
    *   **`orders.py`:**
        *   Remove duplicated local Pydantic schemas.
        *   Remove unused in-memory database code.
        *   Consolidate the `GET /` endpoint to use the repository.
        *   Use `OrderRepository(db)` consistently for all database operations.
        *   Ensure endpoints use the corrected schemas (with `id: int`) imported from `app/api/v1/schemas.py`.
        *   Ensure the `order_id` path parameter is type-hinted as `int`.
    *   **`tables.py`:**
        *   Import `Table`, `TableCreate`, `TableUpdate` from the corrected `app/api/v1/schemas.py`.
        *   Remove the module-level repository instance.
        *   Modify endpoint functions to call repository methods via the class: `TableRepository.method_name(db, ...)`.
        *   Ensure the `table_id` path parameter is type-hinted as `int`.
    *   Verify and correct ID type hints (`int` vs `str`) in path parameters and request/response models for all other endpoints based on the corrected schemas and models.

4.  **Delete Outdated Schema File:**
    *   Remove the file `app/schemas/table.py` to avoid confusion and duplication.

5.  **Verify Models (`app/db/models/*.py`):**
    *   Briefly review all models to ensure primary key columns (`id`) are consistently defined (likely `Integer`, unless UUIDs (`String`) are intentionally used elsewhere).

6.  **Address Imports:**
    *   After refactoring, run the application or use linting tools to catch any remaining `ImportError` issues.
    *   Fix import paths and ensure necessary `__init__.py` files exist in directories intended to be Python packages/modules.

## Visual Plan Summary:

```mermaid
graph TD
    subgraph "ID Type Correction Flow"
        M[Models (DB Source of Truth - Integer IDs)] --> S[Central Schemas (app/api/v1/schemas.py)];
        M --> R[Repositories (app/db/repositories/*)];
        S --> E[Endpoints (app/api/v1/endpoints/*)];
        R --> E;
        S -- Correct ID type to int --> S;
        R -- Correct ID type to int --> R;
        E -- Correct ID type to int --> E;
    end

    subgraph "Cleanup"
        X[Delete app/schemas/table.py]
    end

    subgraph "Refactoring (As Before)"
        RefactorOrders[Refactor orders.py Endpoint]
        RefactorTables[Refactor tables.py Endpoint]
        FixImports[Fix Imports]
    end

    M --> RefactorOrders;
    M --> RefactorTables;
    RefactorOrders --> FixImports;
    RefactorTables --> FixImports;
    X;
```

Implementation of this plan should be done step-by-step, ideally with testing after each major refactoring stage (e.g., after correcting schemas, after refactoring orders endpoints).