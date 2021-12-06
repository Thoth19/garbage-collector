import { useFamiliar } from "kolmafia";
import {
  $item,
  $items,
  $location,
  $monster,
  $skill,
  adventureMacro,
  clamp,
  get,
  have,
  Requirement,
} from "libram";
import { freeFightFamiliar } from "./familiar";
import { findRun, ltbRun } from "./lib";
import { Macro } from "./combat";

export function expectedGregs(): number {
  const baseGregs = 3;
  const timeSpunGregs = have($item`Time-Spinner`)
    ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
    : 0;
  const orbGregs = have($item`miniature crystal ball`) ? 1 : 0;

  const macrometeors = have($skill`Meteor Lore`) ? 10 - get("_macrometeoriteUses") : 0;
  const replaceEnemies = have($item`Powerful Glove`)
    ? Math.floor((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
    : 0;
  const totalMonsterReplacers = macrometeors + replaceEnemies;

  const sabersLeft = have($item`Fourth of May Cosplay Saber`)
    ? clamp(5 - get("_saberForceUses"), 0, 3)
    : 0;

  const baseRateMultiplier = have($skill`Transcendent Olfaction`) ? 0.95 : 0.75;
  const monsterReplacerGregs = clamp(
    totalMonsterReplacers,
    0,
    2 * sabersLeft + baseRateMultiplier * (totalMonsterReplacers - 2 * sabersLeft)
  );
  const gregs = baseGregs + timeSpunGregs + orbGregs + monsterReplacerGregs;
  return gregs;
}

export function doingExtrovermectin(): boolean {
  return get("beGregariousCharges") > 0;
}

export function crateStrategy(): "Sniff" | "Saber" | "Orb" | null {
  if (!doingExtrovermectin()) return null;
  if (have($skill`Transcendent Olfaction`)) return "Sniff";
  if (have($item`miniature crystal ball`)) return "Orb";
  if (have($item`Fourth of May Cosplay Saber`)) return "Saber";
  return null;
}

export function saberCrateIfDesired(): void {
  if (crateStrategy() !== "Saber") return;
  if (
    get("_saberForceUses") > 0 &&
    (get("_saberForceMonster") !== $monster`crate` || get("_saberForceMonsterCount") < 2)
  ) {
    const run = findRun() ?? ltbRun;
    const macro = Macro.trySkill($skill`Transcendent Olfaction`)
      .trySkill($skill`Offer Latte to Opponent`)
      .externalIf(
        get("_gallapagosMonster") !== $monster`crate` && have($skill`Gallapagosian Mating Call`),
        Macro.trySkill($skill`Gallapagosian Mating Call`)
      )
      .step(run.macro);

    new Requirement(["100 Monster Level"], { forceEquip: $items`Fourth of May Cosplay Saber` })
      .merge(run.requirement ? run.requirement : new Requirement([], {}))
      .maximize();
    useFamiliar(freeFightFamiliar());
    if (run.prepare) run.prepare();
    adventureMacro(
      $location`Noob Cave`,
      Macro.if_($monster`crate`, macro)
        .if_($monster`time-spinner prank`, Macro.kill())
        .ifHolidayWanderer(run.macro)
        .abort()
    );
  }
}
