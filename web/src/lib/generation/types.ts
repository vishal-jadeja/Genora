import { platformEnum } from "@/db/schema";

export type Platform = (typeof platformEnum.enumValues)[number];
