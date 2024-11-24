import map from "../asset/foreground.svg?parse";

export default function Map() {
  return (
    <svg>
      <g
        id={map.layer1.attributes.id}
        style={map.layer1.attributes.style}
        data-label={map.layer1.attributes.label}
      >
        {map.layer1.paths.map((path) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      <g
        id={map.layer2.attributes.id}
        style={map.layer2.attributes.style}
        data-label={map.layer2.attributes.label}
      >
        {map.layer2.paths.map((path) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      <g
        id={map.layer3.attributes.id}
        style={map.layer3.attributes.style}
        data-label={map.layer3.attributes.label}
      >
        {map.layer3.groups.map((group) => (
          <g
            key={group.attributes.id}
            id={group.attributes.id}
            data-label={group.attributes.label}
          >
            {group.rects.map((rect) => (
              <rect
                key={rect.id}
                id={rect.id}
                width={parseFloat(rect.width)}
                height={parseFloat(rect.height)}
                x={parseFloat(rect.x)}
                y={parseFloat(rect.y)}
                style={rect.style}
                data-label={rect.label}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
