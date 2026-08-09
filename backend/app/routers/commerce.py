from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.domain.database import get_db
from app.domain.models.commerce import Cart, CartItem, Order, OrderItem, OrderStatus
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/commerce", tags=["commerce"])

class AddToCartRequest(BaseModel):
    garment_id: int
    quantity: int = 1

@router.post("/cart")
def add_to_cart(
    request: AddToCartRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_id = current_user.id 
    
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    item = CartItem(cart_id=cart.id, garment_id=request.garment_id, quantity=request.quantity)
    db.add(item)
    db.commit()
    
    return {"message": "Item added to cart"}

@router.post("/checkout")
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_id = current_user.id
    
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    order = Order(user_id=user_id, total_amount=0.0, status=OrderStatus.PENDING)
    db.add(order)
    db.commit()
    db.refresh(order)
    
    total = 0.0
    for item in cart.items:
        # Simulate price 100
        price = 100.0 
        order_item = OrderItem(order_id=order.id, garment_id=item.garment_id, price=price, quantity=item.quantity)
        total += price * item.quantity
        db.add(order_item)
        db.delete(item)
        
    order.total_amount = total
    db.commit()
    
    return {"message": "Order placed successfully", "order_id": order.id, "total": total}
