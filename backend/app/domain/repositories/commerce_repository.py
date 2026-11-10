from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.domain.repositories.base import BaseRepository
from app.domain.models.catalog import Garment
from app.domain.models.commerce import Cart, CartItem, Order, OrderItem, OrderStatus


class CartRepository(BaseRepository[Cart]):
    """Repositorio para encapsular todas las operaciones de persistencia de Carrito (DIP y SRP)."""

    def get_by_user(self, db: Session, user_id: int) -> Optional[Cart]:
        return db.query(Cart).filter(Cart.user_id == user_id).first()

    def get_by_user_with_items(self, db: Session, user_id: int) -> Optional[Cart]:
        """Recupera el carrito del usuario con sus ítems, prendas, imágenes y assets precargados (evita N+1)."""
        return (
            db.query(Cart)
            .options(
                joinedload(Cart.items)
                .joinedload(CartItem.garment)
                .joinedload(Garment.images),
                joinedload(Cart.items)
                .joinedload(CartItem.garment)
                .joinedload(Garment.asset),
            )
            .filter(Cart.user_id == user_id)
            .first()
        )

    def get_or_create_for_user(self, db: Session, user_id: int) -> Cart:
        cart = self.get_by_user(db, user_id)
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    def get_item_in_cart(self, db: Session, cart_id: int, item_id: int) -> Optional[CartItem]:
        return (
            db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart_id)
            .first()
        )

    def add_or_increment_item(
        self,
        db: Session,
        *,
        cart: Cart,
        garment_id: int,
        quantity: int,
        size: Optional[str],
        color: Optional[str],
        max_quantity: int = 99,
    ) -> CartItem:
        existing_item = (
            db.query(CartItem)
            .filter(
                CartItem.cart_id == cart.id,
                CartItem.garment_id == garment_id,
                CartItem.size == size,
                CartItem.color == color,
            )
            .first()
        )
        if existing_item:
            existing_item.quantity = min(existing_item.quantity + quantity, max_quantity)
            db.commit()
            return existing_item

        item = CartItem(
            cart_id=cart.id,
            garment_id=garment_id,
            quantity=quantity,
            size=size,
            color=color,
        )
        db.add(item)
        db.commit()
        return item

    def update_item_quantity(self, db: Session, item: CartItem, quantity: int) -> CartItem:
        item.quantity = quantity
        db.commit()
        return item

    def remove_item(self, db: Session, item: CartItem) -> None:
        db.delete(item)
        db.commit()

    def clear_for_user(self, db: Session, user_id: int) -> int:
        cart = self.get_by_user(db, user_id)
        if not cart:
            return 0
        removed = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .delete(synchronize_session=False)
        )
        db.commit()
        return removed


class OrderRepository(BaseRepository[Order]):
    """Repositorio para encapsular la creación y consulta de Órdenes de Compra."""

    def create_from_cart(self, db: Session, user_id: int, cart: Cart) -> Order:
        """Convierte los ítems del carrito en una orden con snapshot de precios y vacía el carrito."""
        order = Order(user_id=user_id, total_amount=0.0, status=OrderStatus.PENDING)
        db.add(order)
        db.commit()
        db.refresh(order)

        total = 0.0
        for item in cart.items:
            garment = item.garment
            price = garment.price if garment else 0.0
            order_item = OrderItem(
                order_id=order.id,
                garment_id=item.garment_id,
                price=price,
                quantity=item.quantity,
                size=item.size,
                color=item.color,
            )
            total += price * item.quantity
            db.add(order_item)
            db.delete(item)

        order.total_amount = round(total, 2)
        db.commit()
        db.refresh(order)
        return order

    def get_by_user_with_items(self, db: Session, user_id: int) -> List[Order]:
        """Recupera el historial de órdenes del usuario con sus ítems y prendas precargados."""
        return (
            db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.garment))
            .filter(Order.user_id == user_id)
            .all()
        )


cart_repo = CartRepository(Cart)
order_repo = OrderRepository(Order)

