import { scandinavian_defense } from "./scandinavian-defense-white";
import { vs_caro_kann } from "./vs-caro-kann-white";
import { frech_defense } from "./frech-defense-white";
import { viena } from "./viena-white";
import { carokann } from "./carokann-black";

export const openings = [
...viena,
  ...carokann,
  ...frech_defense,
  ...vs_caro_kann,
  ...scandinavian_defense
];