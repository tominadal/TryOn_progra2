"""
Application-level constants.
Using named constants instead of magic numbers prevents silent bugs
when role assignments change in the seed data.
"""


class RoleID:
    """Maps semantic role names to their integer PKs in the 'roles' table."""
    CUSTOMER = 1
    BRAND_MANAGER = 2
    MARKETPLACE_ADMIN = 3
