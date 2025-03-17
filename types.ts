export type { Key, Event, NoteProps, Action, State };
export { Column, Constants, Viewport, Note };

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
} as const;

const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
};

/** Constants */
const Constants = {
    svg: document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement,
    TICK_RATE_MS: 7,
    ANIMATION_PER_TICK: 1,
    SONG_NAME: "RockinRobin",
    SCORE_PER_CLICK: 5,
    MAX_VELOCITY: 127,
    MAX_Y: 350,
    THRESHOLD_Y: 30,
} as const;

type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

type Event = "keydown" | "keyup" | "keypress";

/** Columns */
const enum Column {
    GREEN = 0,
    RED = 1,
    BLUE = 2,
    YELLOW = 3,
}

/** Note properties */
type NoteProps = Readonly<{
    id: number;
    user_played: boolean;
    instrument_name: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    cy: number; 
    column: number;
    tail: boolean
}>;


/** State processing */
type State = Readonly<{
    gameEnd: boolean;
    userNotes: NoteProps[];
    exitNotes: NoteProps[];
    playNote: NoteProps | null;
    backgroundNote: NoteProps | null;
    score: number;
    highScore: number;
    multiplier: number;
    consecutiveNoteCount: number;
}>;
/**
 * Actions modify state
 */
interface Action {
    apply(s: State): State;
}
