from _typeshed import Incomplete
from chirpQt.errors import ImmutableValueError as ImmutableValueError, InvalidDataError as InvalidDataError, InvalidMemoryLocation as InvalidMemoryLocation
from chirpQt.utils.common import ALL_DTCS_CODES as ALL_DTCS_CODES, CROSS_MODES as CROSS_MODES, DTCS_CODES as DTCS_CODES, MODES as MODES, SKIP_VALUES as SKIP_VALUES, TONES as TONES, TONE_MODES as TONE_MODES, VALIDTONE as VALIDTONE, format_freq as format_freq
from chirpQt.utils.powerlevel import PowerLevel as PowerLevel
from typing import Any

LOG: Incomplete
SEPCHAR: str

class Memory:
    """Base class for a single radio memory."""
    freq: float
    number: int
    extd_number: str
    name: str
    vfo: int
    rtone: float
    ctone: float
    dtcs: int
    rx_dtcs: int
    tmode: str
    cross_mode: str
    dtcs_polarity: str
    skip: str
    power: PowerLevel | None
    duplex: str
    offset: float
    mode: str
    tuning_step: float
    comment: str
    empty: bool
    immutable: list[str]
    dv_urcall: str
    dv_rpt1call: str
    dv_rpt2call: str
    dv_code: int
    dv_mem: bool
    extra: list[object]
    def __init__(self, number: int = 0, empty: bool = False, name: str = '', dv_mem: bool = False) -> None:
        """Construct a memory.

        Parameters:
           number:  Memory number.
           Empty:  Is this memory empty?
           name:  String label for memory
           dv_mem:  Tells if this is a dv memory.
        """
    def debug_diff(self, other: object, delim: str = '/') -> str:
        """Get debug info."""
    def debug_dump(self):
        """Emit debug infor."""
    def dupe(self) -> object:
        """Return a deep copy of @self."""
    def clone(self, source: object) -> None:
        """Absorb all of the properties of @source."""
    CSV_FORMAT: Incomplete
    def __setattr__(self, name: str, val: Any) -> None:
        """Set attribute name to val.

        Parameters:
           Name:  Name of the attribute.
           val:  The value to set name to.
        """
    def to_csv(self) -> list[str]:
        """Return a CSV representation of this memory."""
    def really_from_csv(self, vals: Any) -> bool:
        """Careful parsing of split-out @vals."""
