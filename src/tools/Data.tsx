import { imag } from "@tensorflow/tfjs-core";

import mastery1 from "../assets/mastery_1.png";
import mastery2 from "../assets/mastery_2.png";
import mastery3 from "../assets/mastery_3.png";
import mastery4 from "../assets/mastery_4.png";
import mastery5 from "../assets/mastery_5.png";
import orangeEssence from "../assets/oe.png";
import blueEssence from "../assets/be.png";
import riotPoints from "../assets/rp.png";
import chest from "../assets/chest_available.png";

type LookupLabel = [id: number, name: string, price: number, legacy: number];
type LookupLabels = LookupLabel[] | string[];

type LookupTable = {
  champions: LookupLabels;
  skins: LookupLabels;
  wards: LookupLabels;
  [x: string]: any;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  canvas: HTMLCanvasElement;
  cat?: string;
  type?: string;
  count?: number;
  name?: string;
  data?: any;
};

type championsTableRow = {
  id: string | number;
  name: string;
  owned: boolean | string;
  mastery: number;
  chestAvail: boolean;
  shards: number;
  perms: number;
  token6: number;
  token7: number;
  eternalShards: number;
  storeBE: number;
  storeRP: number;
  ugradeBE: number;
  disenchantS: number;
  disenchantP: number;
};

type skinTableRow = {
  id: string | number;
  name: string;
  price: number;
};

export default class Data {
  loot_lookup_table: LookupTable;
  champions: { columns: any; data: championsTableRow[] };
  skins: { columns: any; data: skinTableRow[] };
  blueEssenceSpent: number;

  constructor(loot_lookup_table: LookupTable, rects: Rect[]) {
    this.loot_lookup_table = loot_lookup_table;
    this.champions = this.championsTable(rects);
    this.blueEssenceSpent = this.calcBlueEssenceSpent(this.champions);
    this.skins = this.skinsList(rects);
  }

  calcBlueEssenceSpent(champions: any) {
    const data = champions.data;
    return [
      0,
      0,
      ...data.flatMap((v: any) => (v.owned ? v.storeBE : [])),
    ].reduce((a: number, b: number) => a + b);
  }

  skinsList(rects: Rect[]) {
    let skins: Rect[] = [];

    rects.forEach((rect) => {
      if (rect.type === "collection_skin") {
        skins.push(rect);
      }
    });

    const skinPrices = Array.from(this.loot_lookup_table.skins as any).reduce(
      (prev: any, curr: any) => ({
        ...prev,
        [curr[0]]: { id: curr[0], name: curr[1], price: curr[2] },
      }),
      {}
    );

    console.log(skins);

    return {
      columns: [
        {
          Header: "Skin name",
          accessor: "name",
          Cell: (data: any) => (
            <div style={{ textAlign: "left" }}>{data.value}</div>
          ),
        },
        {
          Header: "RP price",
          accessor: "price",
          Cell: (data: any) => (
            <div style={{ textAlign: "left" }}>
              {data.value !== "special" && (
                <img
                  src={riotPoints}
                  alt="Riot Points"
                  title="Riot Points"
                  className="currency"
                />
              )}{" "}
              {data.value}
            </div>
          ),
        },
      ],
      data: skins.map((rect) => (skinPrices as any)[rect.data[0]]),
      // data: [
      //   {
      //     id: 123,
      //     name: "Somename",
      //     price: 1234,
      //   },
      // ],
    };
  }

  championsTable(rects: Rect[]) {
    const RP2data = {
      "260": {
        BE: 450,
        upgrade: 270,
        disenchantS: 90,
        disenchantP: 225,
      },
      "585": {
        BE: 1350,
        upgrade: 810,
        disenchantS: 270,
        disenchantP: 675,
      },
      "790": {
        BE: 3150,
        upgrade: 1890,
        disenchantS: 630,
        disenchantP: 1575,
      },
      "880": {
        BE: 4800,
        upgrade: 2880,
        disenchantS: 960,
        disenchantP: 2400,
      },
      "975": {
        BE: 6300,
        upgrade: 3780,
        disenchantS: 1260,
        disenchantP: 3150,
      },
    };

    const champList = (this.loot_lookup_table.champions as LookupLabel[]).map(
      (champ: LookupLabel) => champ[1]
    );

    const data = (this.loot_lookup_table.champions as LookupLabel[]).map(
      (champ: LookupLabel) => ({
        id: champ[0],
        name: champ[1],
        owned: false,
        mastery: 0,
        chestAvail: false,
        shards: 0,
        perms: 0,
        token6: 0,
        token7: 0,
        eternalShards: 0,
        storeBE: RP2data[champ[2] as 260 | 585 | 790 | 880 | 975].BE,
        storeRP: champ[2],
        ugradeBE: RP2data[champ[2] as 260 | 585 | 790 | 880 | 975].upgrade,
        disenchantS:
          RP2data[champ[2] as 260 | 585 | 790 | 880 | 975].disenchantS,
        disenchantP:
          RP2data[champ[2] as 260 | 585 | 790 | 880 | 975].disenchantP,
      })
    );

    rects.forEach((rect) => {
      const index = champList.indexOf(rect.name.replace("(?) ", ""));
      if (index !== -1) {
        if (rect.type === "token6") data[index].token6 = rect.count;
        if (rect.type === "token7") data[index].token7 = rect.count;
        if (rect.type === "eternal") data[index].eternalShards = rect.count;

        if (typeof rect.cat !== "undefined" && rect.cat === "champions") {
          if (rect.type === "shard") data[index].shards = rect.count;
          if (rect.type === "permanent") data[index].perms = rect.count;
        }
        if (rect.type === "collection_champion") {
          data[index].owned = rect.data.owned;
          data[index].mastery = rect.data.mastery;
          data[index].chestAvail = rect.data.chestAvailable;
        }
      }
    });

    const columns = [
      // {
      //   Header: "Image",
      //   accessor: "id",
      //   Cell: (data: any) => (
      //     <img
      //       src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/${data.value.replace(
      //         /...$/,
      //         ""
      //       )}/${data.value}.jpg`}
      //       alt=""
      //     />
      //   ),
      // },
      {
        Header: (
          <>
            Champion, Mastery and
            <br />
            Chest Avavilability
          </>
        ),
        accessor: "name",
        Cell: (data: any) => {
          const row = data.row.original;
          return [
            row.owned ? (
              <span>
                <strong>{row.name}</strong>
              </span>
            ) : (
              <span>{row.name}</span>
            ),
            row.mastery > 0 ? (
              <img
                src={
                  ["", mastery1, mastery2, mastery3, mastery4, mastery5][
                    row.mastery
                  ]
                }
                alt={`Mastery level: ${row.mastery}`}
                title={`Mastery level: ${row.mastery}`}
              />
            ) : (
              ""
            ),
            row.chestAvail > 0 ? (
              <img src={chest} alt="Chest available" title="Chest available" />
            ) : (
              ""
            ),
          ];
        },
      },
      // {
      //   Header: "Owned",
      //   accessor: "owned",
      //   Cell: (data: any) => {
      //     return typeof data.value == "boolean"
      //       ? data.value
      //         ? "YES"
      //         : "NO"
      //       : data.value;
      //   },
      // },
      // {
      //   Header: "Mastery",
      //   accessor: "mastery",
      // },
      // {
      //   Header: "Chest Available",
      //   accessor: "chestAvail",
      //   Cell: (data: any) =>
      //     typeof data.value == "boolean"
      //       ? data.value
      //         ? "YES"
      //         : "NO"
      //       : data.value,
      // },
      {
        Header: "Shards",
        accessor: "shards",
      },
      {
        Header: "Permanents",
        accessor: "perms",
      },
      {
        Header: (
          <>
            Lvl 6
            <br />
            Tokens
          </>
        ),
        accessor: "token6",
      },
      {
        Header: (
          <>
            Lvl 7
            <br />
            Tokens
          </>
        ),
        accessor: "token7",
      },
      {
        Header: (
          <>
            Eternal
            <br />
            Shards
          </>
        ),
        accessor: "eternalShards",
      },
      {
        Header: "Store Price",
        Cell: (data: any) => {
          const row = data.row.original;
          return [
            row.storeBE,
            <img
              src={blueEssence}
              alt="Blue Essence"
              title="Blue Essence"
              className="currency"
            />,
            "/",
            row.storeRP,
            <img
              src={riotPoints}
              alt="Riot Points"
              title="Riot Points"
              className="currency"
            />,
          ];
        },
      },
      {
        Header: (
          <>
            Upgrade
            <br />
            Price
          </>
        ),
        accessor: "ugradeBE",
        Cell: (data: any) => [
          data.value,
          <img
            src={blueEssence}
            alt="Blue Essence"
            title="Blue Essence"
            className="currency"
          />,
        ],
      },
      {
        Header: (
          <>
            Disenchat
            <br />
            Shard
          </>
        ),
        accessor: "disenchantS",
        Cell: (data: any) => [
          data.value,
          <img
            src={blueEssence}
            alt="Blue Essence"
            title="Blue Essence"
            className="currency"
          />,
        ],
      },
      {
        Header: (
          <>
            Disenchat
            <br />
            Permanent
          </>
        ),
        accessor: "disenchantP",
        Cell: (data: any) => [
          data.value,
          <img
            src={blueEssence}
            alt="Blue Essence"
            title="Blue Essence"
            className="currency"
          />,
        ],
      },
    ];

    return { columns, data };
  }

  skinsTable() {}

  wardsTable() {}

  emotesTable() {}

  iconsTable() {}

  chromasTable() {}
}
