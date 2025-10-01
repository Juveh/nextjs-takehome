from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Takehome API", version="1.0.0")

# Allow local frontend by default; adjust origins as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Item(BaseModel):
    id: int = Field(..., ge=1)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class PaginatedItemsResponse(BaseModel):
    items: List[Item]
    page: int
    page_size: int
    total_items: int
    total_pages: int


# Simple in-memory dataset for demo purposes
DATASET: List[Item] = [
    Item(id=i, name=f"Item {i}", description=f"Description for item {i}")
    for i in range(1, 151)
]


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/items", response_model=PaginatedItemsResponse)
def list_items(
    page: int = Query(1, ge=1, description="1-based page index"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Case-insensitive search in name or description")
):
    # Filter by search if provided
    if search:
        q = search.lower()
        filtered = [
            item for item in DATASET
            if q in item.name.lower() or (item.description and q in item.description.lower())
        ]
    else:
        filtered = DATASET

    total_items = len(filtered)
    if total_items == 0:
        return PaginatedItemsResponse(items=[], page=page, page_size=page_size, total_items=0, total_pages=0)

    # Calculate bounds
    total_pages = (total_items + page_size - 1) // page_size
    if page > total_pages:
        raise HTTPException(status_code=404, detail="Page out of range")

    start = (page - 1) * page_size
    end = start + page_size
    page_items = filtered[start:end]

    return PaginatedItemsResponse(
        items=page_items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
    )


def get_app() -> FastAPI:
    return app



