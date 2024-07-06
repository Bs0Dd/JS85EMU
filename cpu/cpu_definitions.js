CPU.prototype.vectors = {
    RESET                 : 0x0000,
    TRAP_BUS_ERROR        : 0x0004,
    TRAP_RESERVED_OPCODE  : 0x0008,
    TRAP_T_BIT            : 0x000C,
    TRAP_IO               : 0x0010,
    TRAP_ACLO             : 0x0014,
    TRAP_EMT              : 0x0018,
    TRAP_TRAP             : 0x001C,
    TRAP_EVNT             : 0x0040, /* 0x0020 or 0x0040?*/
    TRAP_HALT             : 0x0078,
    TRAP_WIR              : 0x00A8
};

CPU.prototype.flags = {
    H : 0x0100,
    I : 0x0080,
    T : 0x0010,
    N : 0x0008,
    Z : 0x0004,
    V : 0x0002,
    C : 0x0001
};
/*
CPU.prototype.states = {
    RUN: 0,
    VECTOR: 1
};
*/
