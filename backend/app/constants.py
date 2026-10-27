"""
Application-level constants.
Using named constants instead of magic numbers prevents silent bugs
when role assignments change in the seed data.
"""


# A user (e.g. a parent) can keep several avatars, one per person they shop for
MAX_AVATARS_PER_USER = 10


class RoleID:
    """Maps semantic role names to their integer PKs in the 'roles' table."""
    CUSTOMER = 1
    BRAND_MANAGER = 2
    MARKETPLACE_ADMIN = 3
