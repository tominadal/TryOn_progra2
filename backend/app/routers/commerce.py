from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.domain.database import get_db
from app.domain.models.commerce import Cart, CartItem, Order, OrderItem, OrderStatus
from app.domain.models.catalog import Garment
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/commerce", tags=["commerce"])


class AddToCartRequest(BaseModel):
    garment_id: int = Field(..., gt=0, description="ID of the garment to add")
    quantity: int = Field(1, ge=1, le=99, description="Number of units (1-99)")


@router.get("/cart")
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve the current user's shopping cart."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return {"items": [], "total": 0.0}

    items = []
    total = 0.0
    for item in cart.items:
        garment = db.query(Garment).filter(Garment.id == item.garment_id).first()
        price = garment.price if garment else 0.0
        items.append(
            {
                "cart_item_id": item.id,
                "garment_id": item.garment_id,
                "garment_name": garment.name if garment else "Unknown",
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
    # --- Validate that the garment exists and is processed ---
    garment = db.query(Garment).filter(Garment.id == request.garment_id).first()
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

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    # Check if the garment is already in the cart — update quantity if so
    existing_item = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.garment_id == request.garment_id)
        .first()
    )
    if existing_item:
        existing_item.quantity += request.quantity
    else:
        item = CartItem(
            cart_id=cart.id,
            garment_id=request.garment_id,
            quantity=request.quantity,
        )
        db.add(item)

    db.commit()
    return {"message": "Item added to cart"}


@router.delete("/cart/{item_id}", status_code=status.HTTP_200_OK)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a specific item from the cart."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")

    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )

    db.delete(item)
    db.commit()
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
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    order = Order(user_id=current_user.id, total_amount=0.0, status=OrderStatus.PENDING)
    db.add(order)
    db.commit()
    db.refresh(order)

    total = 0.0
    for item in cart.items:
        garment = db.query(Garment).filter(Garment.id == item.garment_id).first()
        # Snapshot price at checkout time
        price = garment.price if garment else 0.0

        order_item = OrderItem(
            order_id=order.id,
            garment_id=item.garment_id,
            price=price,
            quantity=item.quantity,
        )
        total += price * item.quantity
        db.add(order_item)
        db.delete(item)

    order.total_amount = round(total, 2)
    db.commit()

    return {
        "message": "Order placed successfully",
        "order_id": order.id,
        "total": round(total, 2),
    }


@router.get("/orders")
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all orders for the current user."""
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    result = []
    for order in orders:
        items = []
        for oi in order.items:
            garment = db.query(Garment).filter(Garment.id == oi.garment_id).first()
            items.append(
                {
                    "garment_id": oi.garment_id,
                    "garment_name": garment.name if garment else "Unknown",
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
