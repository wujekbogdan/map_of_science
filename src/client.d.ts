declare module '*.svg?parse' {
  const content: {
    layer1: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      paths: {
        id: string;
        label: string;
        style: object;
        d: string;
      }[];
    };
    layer2: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      paths: {
        id: string;
        label: string;
        style: object;
        d: string;
      }[];
    };
    layer3: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      group: {
        attributes: {
          id: string;
          label: string;
        };
        rects: {
          id: string;
          label: string;
          style: object;
          width: string;
          height: string;
          x: string;
          y: string;
        }[];
      };
    };
  }
  export default content;
}
