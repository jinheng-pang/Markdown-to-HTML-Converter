import { Action, NoteProps, State, Constants } from "./types";
import { RNG } from "./util";
export { Tick, SpawnNote, SpawnBackgroundNote, Click, EndGame, reduceState, tick };

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
class Tick implements Action {
    constructor() {}
    /**
     * interval tick
     * @param s old State
     * @returns new State
     */
    apply(s: State): State {
        return tick({...s, backgroundNote: null}, null)
    }
}

/**
 * Updates the game state by processing one time step.
 *
 * @param state - The current game state.
 * @param noteToPlay - The note that is currently being played, or null if no note is being played.
 * @returns The updated game state.
 */
const tick = (state: State, noteToPlay: NoteProps | null): State => {     
    // Update the position of each note and filter out the note that has been played
    const updatedNotes = noteToPlay 
        ? state.userNotes.filter(note => note.id !== noteToPlay.id).map(updateAnimation)
        : state.userNotes.map(updateAnimation);

    // Filter out notes that should be removed from userNotes
    const activeNotes = updatedNotes.filter(note => note.cy < Constants.MAX_Y);

    // Filter out notes that have reached MAX_Y and were not played
    const missedNotes = updatedNotes.filter(note => note.cy === Constants.MAX_Y);

    // Calculate the updated score
    const newScore = state.score - (missedNotes.length * Constants.SCORE_PER_CLICK);

    /** 
     * Calculate the new consecutive note count and multiplier:
     * - Increment the consecutive note count if no notes were missed and a note was played.
     * - Reset the consecutive note count if a note was missed and no note was played.
     */
    const newConsecutiveNoteCount = (noteToPlay && noteToPlay.column === 5)
        ? state.consecutiveNoteCount // Do not change if noteToPlay is a random generated note
        : (missedNotes.length === 0
            ? (noteToPlay ? state.consecutiveNoteCount + 1 : state.consecutiveNoteCount) // Increment if a note was hit
            : (noteToPlay ? 1 : 0)); // Reset to 1 if a note was hit but another was missed, otherwise 0

    // Calculate the score multiplier based on consecutive note count
    const newMultiplier = Math.max(1, parseFloat((1 + Math.floor(state.consecutiveNoteCount / 10) * 0.2).toPrecision(2))); // ensure it is in 2 precision point

    return {
        ...state,
        userNotes: activeNotes, // Update with filtered notes
        exitNotes: state.userNotes,
        playNote: noteToPlay,
        score: Math.max(0, newScore),
        highScore: Math.max(newScore, state.highScore),
        multiplier: newMultiplier,
        consecutiveNoteCount: newConsecutiveNoteCount,
    };
};

/**
 * Updates the vertical position of a note for animation purposes.
 *
 * @param note - The note to be updated.
 * @returns The updated note with the new vertical position.
 */
const updateAnimation = (note: NoteProps): NoteProps => ({
    ...note,
    cy: note.cy + Constants.ANIMATION_PER_TICK
});

/**
 * Action to spawn a new note for the user.
 */
class SpawnNote implements Action {
    constructor(public readonly note: NoteProps) {}

    /**
     * Applies the action to the given state by adding the note to the userNotes list.
     *
     * @param state - The current game state.
     * @returns The updated game state with the new note added to userNotes.
     */
    apply(state: State): State {
        return tick({
            ...state,
            userNotes: state.userNotes.concat(this.note),
            backgroundNote: null, // Ensure no background note is present
        }, null);
    }
}

/**
 * Action to spawn a new background note.
 */
class SpawnBackgroundNote implements Action {
    constructor(public readonly note: NoteProps) {}

    /**
     * Applies the action to the given state by setting the backgroundNote to the new note.
     *
     * @param state - The current game state.
     * @returns The updated game state with the new background note set.
     */
    apply(state: State): State {
        return tick({
            ...state,
            backgroundNote: this.note,
        }, null);
    }
}

/**
 * Action to handle a user click on a specific column.
 */
class Click implements Action {
    constructor(public readonly column: number) {}

    /**
     * Applies the action to the given state by processing the click on the specified column.
     *
     * @param state - The current game state.
     * @returns The updated game state based on whether a valid note was clicked or not.
     */
    apply(state: State): State {
        // Filter valid notes that are in the target column and close to the threshold for a successful hit
        const validNotes = state.userNotes.filter(
            (note) => note.cy > (Constants.MAX_Y - Constants.THRESHOLD_Y) && note.column === this.column
        );
        // Get the first valid note to play (if any)
        const noteToPlay = validNotes[0];
        if (validNotes.length > 0) {
            // If a valid note is clicked, update the score and process the tick with the note
            return tick({
                ...state,
                backgroundNote: null, // Clear background note
                score: Math.floor(state.score + (Constants.SCORE_PER_CLICK * state.multiplier)), // Update score with multiplier
            }, noteToPlay);
        } else {
            // If no valid note is clicked, generate a random note for the column and process the tick
            return tick({
                ...state,
                backgroundNote: null, // Clear background note
            }, generateRandomNote(this.column));
        }
    }
}

/** Generates a random number scaled between [0, 1] */
const generateRandom = (seed: number) => {
    const hash = RNG.hash(seed);
    return RNG.scale(hash);
};

/** Generate random velocity (0 to 127) and scale it to 0-1 */
const generateRandomVelocity = (seed: number) => {
    const randomValue = generateRandom(seed) < 0 ? -(generateRandom(seed)) : generateRandom(seed);
    const velocity = randomValue * 127; // Scale to 0-127
    return velocity / 127; // Scale to 0-1 for Tone.js
};

/** Generate random MIDI pitch (21 to 108 for piano range) */
const generateRandomPitch = (seed: number) => {
    const randomValue = generateRandom(seed);
    const minPitch = 21; // Lowest piano key (A0)
    const maxPitch = 108; // Highest piano key (C8)
    const pitch = Math.floor(randomValue * (maxPitch - minPitch + 1)) + minPitch;
    return pitch;
};

const generateRandomNote = (seed: number): NoteProps => ({
    id: 0,
    user_played: true,
    instrument_name: "piano",
    velocity: generateRandomVelocity(seed),
    pitch: generateRandomPitch(seed),
    start: 0,
    end: 0.5,
    cy: 0,
    column: 5, // Indicate random note
    tail: false
})

/**
 * Action to signal the end of the game.
 */
class EndGame implements Action {
    constructor() {}

    /**
     * Applies the end game action to the current state by marking the game as ended.
     *
     * @param state - The current game state.
     * @returns The updated game state with the game ended flag set to true.
     */
    apply(state: State): State {
        return {
            ...state,
            gameEnd: true // Mark the game as ended
        };
    }
}


/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State
 */
const reduceState = (s: State, action: Action) => action.apply(s);
