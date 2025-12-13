import { writeFile, readFile } from "fs/promises";
import { load, dump } from "js-yaml";
import { Playlist } from "./index.js";

export default async function updateMain(data: Playlist, filename: string) {
  try {
    const newContents = await buildNewMain(data, filename);
    return await writeFile(filename, newContents);
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function buildNewMain(data: Playlist, filename: string) {
  try {
    const currentPlaylists: string | [] =
      (await readFile(filename, "utf-8")) || "";
    const currentJson = load(currentPlaylists) as Playlist[];
    const newPlaylist = {
      playlist: data.playlist,
      link: data.link,
      tracks: data.tracks.map(({ track, artist, album }) => ({
        track,
        artist,
        album,
      })),
    };
    const json = [
      ...(currentPlaylists && currentJson ? currentJson : []),
      newPlaylist,
    ];
    return dump(json);
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
