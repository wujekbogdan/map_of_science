import { describe, it, expect } from "@map-of-science/vitest";
import { Concept, DataPoint } from "../../../api/model";
import { createLabelsCollection, search } from "./search.ts";

const map = {
  layer1: {
    attributes: {
      id: "layer1",
      label: "L1",
      style: {
        display: "inline",
      },
    },
    children: [
      {
        path: {
          boundingBox: {
            center: {
              x: -431.8910662922816,
              y: 22.71598460951293,
            },
            max: {
              x: -322.8051709687215,
              y: 258.8283511316347,
            },
            min: {
              x: -540.9769616158417,
              y: -213.39638191260883,
            },
          },
          d: "PLACEHOLDER",
          id: "path186",
          label: "#Symbole-bity-sygnały",
          style: {},
        },
      },
      {
        path: {
          boundingBox: {
            center: {
              x: -175.98698476092548,
              y: 40.46505714629674,
            },
            max: {
              x: -4.789039521850984,
              y: 265.2055539220782,
            },
            min: {
              x: -347.18492999999995,
              y: -184.2754396294847,
            },
          },
          d: "PLACEHOLDER",
          id: "path187",
          label: "#Społeczeństwo",
          style: {},
        },
      },
    ],
  },
  layer2: {
    attributes: {
      id: "layer2",
      label: "L2",
      style: {
        display: "inline",
      },
    },
    children: [
      {
        path: {
          boundingBox: {
            center: {
              x: -390.95909444203926,
              y: 132.81968177008088,
            },
            max: {
              x: -318.7710632026188,
              y: 247.13325685152185,
            },
            min: {
              x: -463.14712568145967,
              y: 18.506106688639907,
            },
          },
          d: "PLACEHOLDER",
          id: "path1",
          label: "#Komputery i komunikacja",
          style: {},
        },
      },
      {
        path: {
          boundingBox: {
            center: {
              x: 220.04397547889005,
              y: 84.34425781473227,
            },
            max: {
              x: 288.4188627868724,
              y: 220.4664682145745,
            },
            min: {
              x: 151.66908817090766,
              y: -51.77795258510995,
            },
          },
          d: "PLACEHOLDER",
          id: "path2",
          label: "#Bakterie i choroby zakaźne",
          style: {},
        },
      },
    ],
  },
  layer3: {
    attributes: {
      id: "layer3",
      label: "L3",
      style: {
        display: "inline",
      },
    },
    groups: [
      {
        attributes: {
          id: "layer4",
          label: "L3-maszyny",
        },
        children: [
          {
            rect: {
              boundingBox: {
                center: {
                  x: -319.7775159,
                  y: -214.0745055,
                },
                max: {
                  x: -316.76377180000003,
                  y: -210.98814099999998,
                },
                min: {
                  x: -322.79126,
                  y: -217.16087,
                },
              },
              height: 6.172729,
              id: "rect31",
              label: "#Urządzenia mechaniczne",
              style: {
                display: "inline",
                fill: "#000000",
              },
              width: 6.0274882,
              x: -322.79126,
              y: -217.16087,
            },
          },
          {
            rect: {
              boundingBox: {
                center: {
                  x: -297.8461759,
                  y: -230.9224255,
                },
                max: {
                  x: -294.8324318,
                  y: -227.836061,
                },
                min: {
                  x: -300.85992,
                  y: -234.00879,
                },
              },
              height: 6.172729,
              id: "rect27",
              label: "#Robotyka",
              style: {
                display: "inline",
                fill: "#000000",
              },
              width: 6.0274882,
              x: -300.85992,
              y: -234.00879,
            },
          },
        ],
      },
      {
        attributes: {
          id: "layer6",
          label: "L3-Ziemia",
        },
        children: [
          {
            rect: {
              boundingBox: {
                center: {
                  x: -141.0597459,
                  y: -293.0270355,
                },
                max: {
                  x: -138.0460018,
                  y: -289.940671,
                },
                min: {
                  x: -144.07349,
                  y: -296.1134,
                },
              },
              height: 6.172729,
              id: "rect32",
              label: "#Asfalt",
              style: {
                display: "inline",
                fill: "#000000",
              },
              width: 6.0274882,
              x: -144.07349,
              y: -296.1134,
            },
          },
        ],
      },
    ],
  },
};

const options = {
  map,
  dataPoints: new Map<number, DataPoint[]>(),
  concepts: new Map<number, Concept[]>(),
} as never; // TODO: Fix this type

// TODO: Add tests for points
// https://github.com/wujekbogdan/map-of-science/issues/60
describe("mapModel", () => {
  it("should map and flatten the model", () => {
    const model = createLabelsCollection(map);
    expect(model).toMatchSnapshot();
  });

  it("should normalize diacritics", () => {
    // GPT-generated phrases in various languages which include diacritics
    const phrases = [
      "zażółć gęślą jaźń", // Polish
      "Élève où tu es allé déjeuner?", // French
      "Fünf köstliche Äpfel überqueren mühelos die Bühne.", // German
      "El niño comió paella en la habitación número cinco.", // Spanish
      "Avó e avô têm um coração cheio de emoção.", // Portuguese
      "İyi bir güneş gökyüzünde yükseliyor.", // Turkish
      "Příliš žluťoučký kůň úpěl ďábelské ódy.", // Czech
      "Őrült görög író újját törte.", // Hungarian
      "Áfram veginn þótt óvinir mæti.", // Icelandic
      "Mâncăm în grădină, lângă tărâmul viselor.", // Romanian
      "Tôi yêu đất nước Việt Nam xinh đẹp.", // Vietnamese
      "Éire agus Gael óg ó Dhún na nGall.", // Irish
    ];

    const el = (phrase: string) => ({
      label: phrase,
      boundingBox: {
        center: {
          x: 0,
          y: 0,
        },
      },
    });

    const model = createLabelsCollection({
      layer1: {
        children: phrases.map((phrase) => ({
          path: el(phrase),
        })),
      },
      layer2: {
        children: phrases.map((phrase) => ({
          path: el(phrase),
        })),
      },
      layer3: {
        groups: [
          {
            children: phrases.map((phrase) => ({
              rect: el(phrase),
            })),
          },
        ],
      },
    } as typeof map); // Cast to avoid providing all properties

    const normalized = [
      "zazolc gesla jazn",
      "eleve ou tu es alle dejeuner?",
      "funf kostliche apfel uberqueren muhelos die buhne.",
      "el nino comio paella en la habitacion numero cinco.",
      "avo e avo tem um coracao cheio de emocao.",
      "i̇yi bir gunes gokyuzunde yukseliyor.",
      "prilis zlutoucky kun upel dabelske ody.",
      "orult gorog iro ujjat torte.",
      "afram veginn thott ovinir maeti.",
      "mancam in gradina, langa taramul viselor.",
      "toi yeu dat nuoc viet nam xinh dep.",
      "eire agus gael og o dhun na ngall.",
    ];
    expect(model.map(({ normalizedLabel }) => normalizedLabel)).toEqual([
      ...normalized,
      ...normalized,
      ...normalized,
    ]);
  });
});

describe("search", () => {
  it("should return search results", () => {
    expect(search(options, "sygnały")).toEqual({
      labels: [
        {
          boundingBox: {
            center: {
              x: -431.8910662922816,
              y: 22.71598460951293,
            },
            max: {
              x: -322.8051709687215,
              y: 258.8283511316347,
            },
            min: {
              x: -540.9769616158417,
              y: -213.39638191260883,
            },
          },
          id: "path186",
          label: "Symbole-bity-sygnały",
          normalizedLabel: "symbole-bity-sygnaly",
        },
      ],
      points: [],
    });

    expect(search(options, "sygnaly")).toEqual({
      labels: [
        {
          boundingBox: {
            center: {
              x: -431.8910662922816,
              y: 22.71598460951293,
            },
            max: {
              x: -322.8051709687215,
              y: 258.8283511316347,
            },
            min: {
              x: -540.9769616158417,
              y: -213.39638191260883,
            },
          },
          id: "path186",
          label: "Symbole-bity-sygnały",
          normalizedLabel: "symbole-bity-sygnaly",
        },
      ],
      points: [],
    });
  });

  it("should return empty array if no results", () => {
    expect(search(options, "nonexistent")).toEqual({
      labels: [],
      points: [],
    });
    expect(search(options, "")).toEqual({
      labels: [],
      points: [],
    });
  });
});
