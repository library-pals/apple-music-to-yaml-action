import { setFailed, getInput, exportVariable } from "@actions/core";
import * as github from "@actions/github";
import updateMain from "./write-file.js";

export type WorkflowPayload = {
  "playlist-json"?: string;
};

export interface Playlist {
  playlist: string;
  link: string;
  tracks: {
    track: string;
    artist: string;
    album: string;
  }[];
}

export async function action() {
  try {
    const filename = getInput("filename");
    const payload = github.context.payload?.inputs;
    const playlistString =
      payload?.["playlist-json"] || getInput("playlist-json");

    if (!playlistString) {
      throw new Error("Playlist JSON data is required");
    }

    const playlist: Playlist = JSON.parse(playlistString);
    const playlistName = playlist.playlist;
    const playlistFormattedName = playlistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // augment playlist object with formatted name
    playlist["formatted_name"] = playlistFormattedName;
    // export image variable to be downloaded later
    exportVariable("playlist", playlistName);
    // save tracks to playlists.yml
    await updateMain(playlist, filename);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setFailed(errorMessage);
    throw error; // Re-throw for testing
  }
}
