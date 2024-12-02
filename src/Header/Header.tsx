import styled from "styled-components";
import map from "../../asset/foreground.svg?parse";
import { Search } from "./Search/Search.tsx";
import { ZoomControls } from "./ZoomControls/ZoomControls.tsx";

export const Header = () => {
  return (
    <HeaderStyles>
      <Search map={map} />
      <ZoomControls />
    </HeaderStyles>
  );
};

const HeaderStyles = styled.div`
  z-index: 20;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  background-color: transparent;
  display: flex;
  justify-content: space-between;
  padding: 12px;
`;
