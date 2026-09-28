from _typeshed import Incomplete

LOG: Incomplete

class PowerLevel:
    """Represents a power level supported by a radio."""
    def __init__(self, label, watts: float = 0, dBm: float = 0) -> None:
        """Initialize class.

           Converts wats to dbm.

        Parameters:
           Label: String definin power level.
           wats: power level in wiatts.
           dbm: Power level in dbm.

        Returns: None
        """
    def watts_to_dBm(self, watts: float) -> float:
        """Convert @watts in watts to dBm."""
    def dBm_to_watts(self, dBm: float) -> float:
        """Convert @dBm from dBm to watts."""
    def __int__(self) -> int:
        """Return the power as an iteger."""
    def __float__(self) -> float:
        """Return power as a float.

        This should already be a float as defined in __init__.
        """
    def __sub__(self, val: float) -> float:
        """Subtract one power level from another."""
    def __add__(self, val: float) -> float:
        """Add 2 power leverls."""
    def __eq__(self, val: object) -> bool:
        """Test if 2 power levels are equal."""
    def __lt__(self, val: object) -> float:
        """Test if one level is lt this level."""
    def __gt__(self, val: object) -> float:
        """Test if val is greater that current level."""
    def __bool__(self) -> bool:
        """Test is power level is true."""
    @classmethod
    def parse_power(self, powerstr: str) -> object:
        """Parse a power level."""
