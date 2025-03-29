from setuptools import setup, find_packages

setup(
    name="plate-order-system",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.10",
    install_requires=[
        "fastapi",
        "uvicorn",
        "pydantic",
        "python-multipart",
        "aiohttp",
    ],
    extras_require={
        "test": [
            "pytest",
            "pytest-asyncio",
            "pytest-cov",
            "pytest-mock",
            "httpx",
            "black",
            "flake8",
            "mypy",
            "isort",
        ],
    },
) 