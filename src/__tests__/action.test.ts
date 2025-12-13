import { action, Playlist } from "../action";
import { setFailed, getInput, exportVariable } from "@actions/core";
import { context } from "@actions/github";
import updateMain from "../write-file";
import * as playlistFixtureData from "./fixtures/playlist.json";

// Mock modules
jest.mock("@actions/core");
jest.mock("../write-file");
jest.mock("@actions/github");

const mockedSetFailed = setFailed as jest.MockedFunction<typeof setFailed>;
const mockedGetInput = getInput as jest.MockedFunction<typeof getInput>;
const mockedExportVariable = exportVariable as jest.MockedFunction<
  typeof exportVariable
>;
const mockedUpdateMain = updateMain as jest.MockedFunction<typeof updateMain>;
const mockedContext = context as jest.Mocked<typeof context>;

describe("action", () => {
  // Load fixture data
  const playlistFixture = playlistFixtureData as Playlist;
  const playlistJson = JSON.stringify(playlistFixture);

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset github context
    Object.assign(mockedContext, {
      payload: { inputs: {} },
    });

    // Default mock implementations
    mockedGetInput.mockImplementation((name: string) => {
      if (name === "filename") return "_data/playlists.yml";
      if (name === "playlist-json") return "";
      return "";
    });

    // Reset updateMain to resolve successfully by default
    mockedUpdateMain.mockResolvedValue(undefined);
  });

  describe("successful playlist processing", () => {
    it("should process playlist from input successfully", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return playlistJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "2025 Fall"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          formatted_name: "2025-fall",
          tracks: expect.arrayContaining([
            expect.objectContaining({
              track: "Lazy Love",
              album: "Sundays",
              artist: "Tanukichan",
            }),
          ]),
        }),
        "_data/playlists.yml"
      );
    });

    it("should process playlist from github context payload", async () => {
      Object.assign(mockedContext, {
        payload: {
          inputs: {
            "playlist-json": playlistJson,
          },
        },
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "2025 Fall"
      );
      expect(mockedUpdateMain).toHaveBeenCalled();
    });

    it("should format playlist name correctly", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist: "My Awesome Playlist 123!",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "My Awesome Playlist 123!"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name: "my-awesome-playlist-123",
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle playlist with special characters in name", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist: "Rock & Roll + Pop/Hip-Hop",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "Rock & Roll + Pop/Hip-Hop"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name: "rock-roll-pop-hip-hop",
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle empty track list", async () => {
      const customPlaylist = {
        ...playlistFixture,
        tracks: [],
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          tracks: [],
        }),
        "_data/playlists.yml"
      );
    });

    it("should preserve track order", async () => {
      const customPlaylist = {
        ...playlistFixture,
        tracks: [
          {
            track: "First Song",
            artist: "Artist A",
            album: "Album A",
          },
          {
            track: "Second Song",
            artist: "Artist B",
            album: "Album B",
          },
        ],
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          tracks: [
            expect.objectContaining({
              track: "First Song",
              artist: "Artist A",
              album: "Album A",
            }),
            expect.objectContaining({
              track: "Second Song",
              artist: "Artist B",
              album: "Album B",
            }),
          ],
        }),
        "_data/playlists.yml"
      );
    });

    it("should use default filename when not provided", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml"; // Actions provides the default
        if (name === "playlist-json") return playlistJson;
        return "";
      });

      await action();

      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.any(Object),
        "_data/playlists.yml"
      );
    });

    it("should handle track with missing album", async () => {
      const customPlaylist = {
        ...playlistFixture,
        tracks: [
          {
            track: "Track Without Album",
            artist: "Solo Artist",
            // No album property
          },
        ],
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          tracks: [
            expect.objectContaining({
              track: "Track Without Album",
              artist: "Solo Artist",
            }),
          ],
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle null context payload", async () => {
      // Reset github context to have null payload
      Object.assign(mockedContext, {
        payload: null,
      });

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return playlistJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "2025 Fall"
      );
      expect(mockedUpdateMain).toHaveBeenCalled();
    });

    it("should handle undefined context payload", async () => {
      // Reset github context to have undefined payload
      Object.assign(mockedContext, {
        payload: undefined,
      });

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return playlistJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "2025 Fall"
      );
      expect(mockedUpdateMain).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle missing playlist JSON in both input and context", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return "";
        return "";
      });

      await expect(action()).rejects.toThrow();
      expect(mockedSetFailed).toHaveBeenCalled();
    });

    it("should handle invalid JSON format", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return "{ invalid json";
        return "";
      });

      await expect(action()).rejects.toThrow();
      expect(mockedSetFailed).toHaveBeenCalled();
    });

    it("should handle playlist missing required properties", async () => {
      const invalidPlaylist = { tracks: [] }; // Missing playlist and link
      const invalidJson = JSON.stringify(invalidPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return invalidJson;
        return "";
      });

      await expect(action()).rejects.toThrow();
      expect(mockedSetFailed).toHaveBeenCalled();
    });

    it("should handle empty playlist JSON", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return "";
        return "";
      });

      await expect(action()).rejects.toThrow();
      expect(mockedSetFailed).toHaveBeenCalled();
    });

    it("should handle updateMain errors", async () => {
      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return playlistJson;
        return "";
      });

      const updateError = new Error("File write error");
      mockedUpdateMain.mockRejectedValue(updateError);

      await expect(action()).rejects.toThrow("File write error");
      expect(mockedSetFailed).toHaveBeenCalledWith("File write error");
    });
  });

  describe("playlist formatting edge cases", () => {
    it("should handle playlist name with multiple spaces", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist: "Multiple    Spaces   Between   Words",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "Multiple    Spaces   Between   Words"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name: "multiple-spaces-between-words",
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle playlist name with leading/trailing spaces", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist: "   Trimmed Playlist   ",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "   Trimmed Playlist   "
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name: "trimmed-playlist",
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle very long playlist names", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist:
          "This Is A Very Long Playlist Name That Contains Many Words And Should Be Formatted Properly",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "This Is A Very Long Playlist Name That Contains Many Words And Should Be Formatted Properly"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name:
            "this-is-a-very-long-playlist-name-that-contains-many-words-and-should-be-formatted-properly",
        }),
        "_data/playlists.yml"
      );
    });

    it("should handle playlist name with only special characters", async () => {
      const customPlaylist = {
        ...playlistFixture,
        playlist: "!!!@@@###$$$%%%",
      };
      const customJson = JSON.stringify(customPlaylist);

      mockedGetInput.mockImplementation((name: string) => {
        if (name === "filename") return "_data/playlists.yml";
        if (name === "playlist-json") return customJson;
        return "";
      });

      await action();

      expect(mockedExportVariable).toHaveBeenCalledWith(
        "playlist",
        "!!!@@@###$$$%%%"
      );
      expect(mockedUpdateMain).toHaveBeenCalledWith(
        expect.objectContaining({
          formatted_name: "",
        }),
        "_data/playlists.yml"
      );
    });
  });

  describe("module execution", () => {
    it("should be importable without executing action", async () => {
      // This test just imports the module and doesn't execute the action
      // This covers the case where require.main !== module
      const { action: importedAction } = await import("../action");
      expect(importedAction).toBeDefined();
      expect(typeof importedAction).toBe("function");
    });
  });
});
