import styled from "styled-components";
import { YoutubeVideo } from "../../api/model";
import { i18n } from "../../i18n.ts";

type Props = {
  html: string | null;
  videos: YoutubeVideo[];
};

const youtubeIdToImage = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

export const LocalArticle = ({ html, videos }: Props) => {
  return (
    <>
      {
        // It says dangerouslySetInnerHTML, but it's safe because the content comes
        // from local markdown files we control.
      }
      {html && <Article dangerouslySetInnerHTML={{ __html: html }} />}
      {videos.length > 0 && (
        <Videos>
          <ListHeader>
            {i18n(`Powiązane fragmenty "Czytamy Naturę" na YouTube`)}
          </ListHeader>
          <List>
            {videos.map((video) => (
              <ListItem key={video.videoId}>
                <Link
                  href={video.segmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <VideoHeader>{video.segmentName}</VideoHeader>
                  <Thumbnail
                    src={youtubeIdToImage(video.videoId)}
                    alt={video.segmentName}
                  />
                </Link>
              </ListItem>
            ))}
          </List>
        </Videos>
      )}
    </>
  );
};

const Videos = styled.div`
  margin: 48px 0 0 0;

  &:first-child {
    margin: 0;
  }
`;

const ListHeader = styled.h2``;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  margin: 0 0 36px 0;

  &:last-child {
    margin: 0;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const Link = styled.a`
  display: block;
`;

const VideoHeader = styled.h3``;

const Thumbnail = styled.img`
  display: block;
  border-radius: 3px;
  border: 1px solid #eee;
`;

// TODO: Implement proper styling for Markdown content.
// https://github.com/wujekbogdan/map-of-science/issues/58
const Article = styled.div`
  line-height: 1.42;
`;
