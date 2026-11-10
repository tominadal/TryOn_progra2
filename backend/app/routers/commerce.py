from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.domain.database import get_db
from app.domain.models.user import User
from app.domain.repositories import cart_repo, order_repo, garment_repo
from app.domain.schemas.commerce import AddToCartRequest, UpdateQuantityRequest
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/commerce", tags=["commerce"])

MAX_ITEM_QUANTITY = 99


@router.get("/cart")
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve the current user's shopping cart."""
    cart = cart_repo.get_by_user_with_items(db, current_user.id)
    if not cart:
        return {"items": [], "total": 0.0}

    items = []
    total = 0.0
    for item in sorted(cart.items, key=lambda i: i.id):
        garment = item.garment
        price = garment.price if garment else 0.0
        primary_image = None
        if garment:
            if garment.images:
                primary_image = garment.images[0].image_url
            elif garment.asset:
                primary_image = garment.asset.ai_generated_image_url
        items.append(
            {
                "cart_item_id": item.id,
                "garment_id": item.garment_id,
                "garment_name": garment.name if garment else "Unknown",
                "image": primary_image,
                "available_colors": (garment.available_colors or []) if garment else [],
                "size": item.size,
                "color": item.color,
                "quantity": item.quantity,
                "unit_price": round(price, 2),
                "subtotal": round(price * item.quantity, 2),
            }
        )
        total += price * item.quantity

    return {"items": items, "total": round(total, 2)}


@router.post("/cart", status_code=status.HTTP_201_CREATED)
def add_to_cart(
    request: AddToCartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a garment to the current user's cart."""
    garment = garment_repo.get(db, request.garment_id)
    if not garment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garment with id {request.garment_id} not found",
        )
    if not garment.is_processed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This garment is not yet available (still processing)",
        )

    cart = cart_repo.get_or_create_for_user(db, current_user.id)
    cart_repo.add_or_increment_item(
        db,
        cart=cart,
        garment_id=request.garment_id,
        quantity=request.quantity,
        size=request.size,
        color=request.color,
        max_quantity=MAX_ITEM_QUANTITY,
    )
    return {"message": "Item added to cart"}


@router.delete("/cart", status_code=status.HTTP_200_OK)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove every item from the current user's cart. Safe to call on an empty cart."""
    removed = cart_repo.clear_for_user(db, current_user.id)
    return {"message": "Cart cleared", "removed": removed}


@router.patch("/cart/{item_id}", status_code=status.HTTP_200_OK)
def update_cart_item_quantity(
    item_id: int,
    request: UpdateQuantityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Set the quantity of one cart line (use DELETE to remove the line)."""
    cart = cart_repo.get_by_user(db, current_user.id)
    item = cart_repo.get_item_in_cart(db, cart.id, item_id) if cart else None
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )

    updated = cart_repo.update_item_quantity(db, item, request.quantity)
    return {"message": "Quantity updated", "quantity": updated.quantity}


@router.delete("/cart/{item_id}", status_code=status.HTTP_200_OK)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a specific item from the cart."""
    cart = cart_repo.get_by_user(db, current_user.id)
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found"
        )

    item = cart_repo.get_item_in_cart(db, cart.id, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )

    cart_repo.remove_item(db, item)
    return {"message": "Item removed from cart"}


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Converts the cart into an order and clears the cart.
    Prices are locked at checkout time (snapshot pricing).
    """
    cart = cart_repo.get_by_user_with_items(db, current_user.id)
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    order = order_repo.create_from_cart(db, current_user.id, cart)
    return {
        "message": "Order placed successfully",
        "order_id": order.id,
        "total": round(order.total_amount, 2),
    }


@router.get("/orders")
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all orders for the current user."""
    orders = order_repo.get_by_user_with_items(db, current_user.id)
    result = []
    for order in orders:
        items = []
        for oi in order.items:
            garment = oi.garment
            items.append(
                {
                    "garment_id": oi.garment_id,
                    "garment_name": garment.name if garment else "Unknown",
                    "size": oi.size,
                    "color": oi.color,
                    "quantity": oi.quantity,
                    "unit_price": round(oi.price, 2),
                    "subtotal": round(oi.price * oi.quantity, 2),
                }
            )
        result.append(
            {
                "order_id": order.id,
                "status": order.status.value,
                "total": round(order.total_amount, 2),
                "created_at": order.created_at,
                "items": items,
            }
        )
    return result
