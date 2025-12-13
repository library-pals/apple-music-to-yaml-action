import updateMain, { buildNewMain } from "../write-file";
import { readFile, writeFile } from "fs/promises";
import { load, dump } from "js-yaml";
import { Playlist } from "../action";
import playlistFixtureData from "./fixtures/playlist.json";

// Mock fs and js-yaml modules
jest.mock("fs/promises");
jest.mock("js-yaml");

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockedWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockedLoad = load as jest.MockedFunction<typeof load>;
const mockedDump = dump as jest.MockedFunction<typeof dump>;

describe("write-file", () => {
  const playlistFixture = playlistFixtureData as Playlist;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateMain", () => {
    it("should write new contents to file", async () => {
      const mockYamlContent = "- playlist: 2025 Fall\n  tracks: []";
      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue(mockYamlContent);
      mockedWriteFile.mockResolvedValue(undefined);

      await updateMain(playlistFixture, "_data/playlists.yml");

      expect(mockedWriteFile).toHaveBeenCalledWith(
        "_data/playlists.yml",
        mockYamlContent
      );
    });

    it("should handle file write errors", async () => {
      const writeError = new Error("Permission denied");
      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue("yaml content");
      mockedWriteFile.mockRejectedValue(writeError);

      await expect(
        updateMain(playlistFixture, "_data/playlists.yml")
      ).rejects.toThrow("Permission denied");
    });

    it("should handle buildNewMain errors", async () => {
      const readError = new Error("File not found");
      mockedReadFile.mockRejectedValue(readError);

      await expect(
        updateMain(playlistFixture, "_data/playlists.yml")
      ).rejects.toThrow("File not found");
    });
  });

  describe("buildNewMain", () => {
    it("should create new YAML content for empty file", async () => {
      const expectedYaml = "new yaml content";
      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue(expectedYaml);

      const result = await buildNewMain(playlistFixture, "_data/playlists.yml");

      expect(mockedReadFile).toHaveBeenCalledWith(
        "_data/playlists.yml",
        "utf-8"
      );
      expect(mockedLoad).toHaveBeenCalledWith("");
      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          tracks: expect.arrayContaining([
            {
              track: "Lazy Love",
              artist: "Tanukichan",
              album: "Sundays",
            },
          ]),
        },
      ]);
      expect(result).toBe(expectedYaml);
    });

    it("should append to existing playlists", async () => {
      const existingPlaylist = {
        playlist: "Existing Playlist",
        link: "https://music.apple.com/existing",
        tracks: [
          {
            track: "Existing Song",
            artist: "Existing Artist",
            album: "Existing Album",
          },
        ],
      };

      const existingYaml = "existing yaml";
      const expectedNewYaml = "combined yaml";

      mockedReadFile.mockResolvedValue(existingYaml);
      mockedLoad.mockReturnValue([existingPlaylist]);
      mockedDump.mockReturnValue(expectedNewYaml);

      const result = await buildNewMain(playlistFixture, "_data/playlists.yml");

      expect(mockedLoad).toHaveBeenCalledWith(existingYaml);
      expect(mockedDump).toHaveBeenCalledWith([
        existingPlaylist,
        {
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          tracks: expect.arrayContaining([
            {
              track: "Lazy Love",
              artist: "Tanukichan",
              album: "Sundays",
            },
          ]),
        },
      ]);
      expect(result).toBe(expectedNewYaml);
    });

    it("should handle file read errors", async () => {
      const readError = new Error("File access denied");
      mockedReadFile.mockRejectedValue(readError);

      await expect(
        buildNewMain(playlistFixture, "_data/playlists.yml")
      ).rejects.toThrow("File access denied");
    });

    it("should handle YAML parse errors", async () => {
      const parseError = new Error("Invalid YAML");
      mockedReadFile.mockResolvedValue("invalid yaml");
      mockedLoad.mockImplementation(() => {
        throw parseError;
      });

      await expect(
        buildNewMain(playlistFixture, "_data/playlists.yml")
      ).rejects.toThrow("Invalid YAML");
    });

    it("should handle YAML dump errors", async () => {
      const dumpError = new Error("Cannot serialize");
      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockImplementation(() => {
        throw dumpError;
      });

      await expect(
        buildNewMain(playlistFixture, "_data/playlists.yml")
      ).rejects.toThrow("Cannot serialize");
    });

    it("should properly format track data", async () => {
      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue("yaml");

      await buildNewMain(playlistFixture, "_data/playlists.yml");

      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          tracks: expect.arrayContaining([
            {
              track: "Lazy Love",
              artist: "Tanukichan",
              album: "Sundays",
            },
            {
              track: "Junkmail",
              artist: "Daughter",
              album: "Stereo Mind Game",
            },
            {
              track: "Float (feat. Jim Adkins)",
              artist: "Jay Som",
              album: "Belong",
            },
          ]),
        },
      ]);
    });

    it("should handle empty playlist", async () => {
      const emptyPlaylist: Playlist = {
        playlist: "Empty Playlist",
        link: "https://music.apple.com/empty",
        tracks: [],
      };

      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue("yaml");

      await buildNewMain(emptyPlaylist, "_data/playlists.yml");

      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "Empty Playlist",
          link: "https://music.apple.com/empty",
          tracks: [],
        },
      ]);
    });

    it("should handle playlist with special characters in track names", async () => {
      const specialCharsPlaylist: Playlist = {
        playlist: "Special Chars",
        link: "https://music.apple.com/special",
        tracks: [
          {
            track: "Song: With Colons & Ampersands",
            artist: "Artist & Co.",
            album: "Album: Special Edition",
          },
        ],
      };

      mockedReadFile.mockResolvedValue("");
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue("yaml");

      await buildNewMain(specialCharsPlaylist, "_data/playlists.yml");

      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "Special Chars",
          link: "https://music.apple.com/special",
          tracks: [
            {
              track: "Song: With Colons & Ampersands",
              artist: "Artist & Co.",
              album: "Album: Special Edition",
            },
          ],
        },
      ]);
    });

    it("should handle currentPlaylists being falsy", async () => {
      mockedReadFile.mockResolvedValue(null as unknown as string);
      mockedLoad.mockReturnValue([]);
      mockedDump.mockReturnValue("yaml");

      await buildNewMain(playlistFixture, "_data/playlists.yml");

      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          tracks: expect.any(Array),
        },
      ]);
    });

    it("should handle undefined currentJson", async () => {
      mockedReadFile.mockResolvedValue("some content");
      mockedLoad.mockReturnValue(undefined);
      mockedDump.mockReturnValue("yaml");

      await buildNewMain(playlistFixture, "_data/playlists.yml");

      // Should still work, treating undefined as empty array
      expect(mockedDump).toHaveBeenCalledWith([
        {
          playlist: "2025 Fall",
          link: "https://music.apple.com/us/playlist/2025-fall/pl.u-qxyl0bMIWDoKP",
          tracks: expect.any(Array),
        },
      ]);
    });
  });
});
