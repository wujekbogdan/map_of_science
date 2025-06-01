import styled from "styled-components";
import { Search } from "./Search/Search.tsx";
import { ZoomControls } from "./ZoomControls/ZoomControls.tsx";

export const Header = () => {
  return (
    <>
      <SearchWrap>
        <Search />
      </SearchWrap>
      <ZoomControlsWrap>
        <ZoomControls />
      </ZoomControlsWrap>
    </>
  );
};

const offset = "12px";

const SearchWrap = styled.div`
  position: fixed;
  top: ${offset};
  left: ${offset};
`;

const ZoomControlsWrap = styled.div`
  position: fixed;
  top: ${offset};
  right: ${offset};
`;
