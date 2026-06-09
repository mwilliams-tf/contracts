export const BOARD_AREA_FILTERS = ["Compras", "IT", "Marketing"] as const;

export type BoardAreaFilter = (typeof BOARD_AREA_FILTERS)[number];
