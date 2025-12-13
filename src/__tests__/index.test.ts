import { action } from "../action";
import { getInput } from "@actions/core";
import updateMain from "../write-file";

jest.mock("@actions/core");
jest.mock("../write-file");

const mockedGetInput = getInput as jest.MockedFunction<typeof getInput>;
const mockedUpdateMain = updateMain as jest.MockedFunction<typeof updateMain>;

describe("action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processes playlist from input", async () => {
    const playlistJson = JSON.stringify({
      playlist: "Test Playlist",
      link: "https://music.apple.com/library/playlist/p.test123",
      tracks: [
        {
          title: "Test Song",
          artist: "Test Artist",
          album: "Test Album",
        },
      ],
    });

    mockedGetInput.mockImplementation((name: string) => {
      if (name === "filename") return "_data/playlists.yml";
      if (name === "playlist-json") return playlistJson;
      return "";
    });

    await action();

    expect(mockedUpdateMain).toHaveBeenCalledWith(
      expect.objectContaining({
        playlist: "Test Playlist",
        link: "https://music.apple.com/library/playlist/p.test123",
        tracks: expect.any(Array),
        formatted_name: "test-playlist",
      }),
      "_data/playlists.yml"
    );
  });

  test("throws error when playlist-json is missing", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === "filename") return "_data/playlists.yml";
      return "";
    });

    await expect(action()).rejects.toThrow("Playlist JSON data is required");
  });
});
