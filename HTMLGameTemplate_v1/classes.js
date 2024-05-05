//By Levi Sales

//-BASE-CLASSES-

class Load { /*(LOAD) can load different environments dynamically */
    static _current_env_ = null;
    static env_list = new Map();
    static ctx = document.querySelector('canvas').getContext('2d');

    static addContext(ctx = document.querySelector('canvas').getContext('2d')) {
        if (ctx instanceof CanvasRenderingContext2D) this.ctx = ctx;
    }

    static resetContext() {
        this.ctx = document.querySelector('canvas').getContext('2d');
    }

    static newEnv(env_tag = '', env = new Environment({})) {
        if (this.env_list.has(env_tag))
            return console.error(`ERROR: The environment \"${env_tag}\" already exists.`);

        this.env_list.set(env_tag, env);
    }

    static deleteEnv(env_tag = '') {
        if (!this.env_list.has(env_tag))
            return console.error(`ERROR: Unable to remove an unexistent environment \"${env_tag}\".`);

        if (this._current_env_ == this.env_list.get(env_tag))
            this.emptyEnv();

        this.env_list.delete(env_tag);
    }

    static setEnv(env_tag = '') {
        if (!this.env_list.has(env_tag))
            return console.error(`ERROR: Unable to set an unexistent environment \"${env_tag}\".`);

        this._current_env_ = this.env_list.get(env_tag);
    }

    static runEnv() {
        if (this._current_env_ == null)
            return console.error(`ERROR: No environment set to be loaded (_current_env_ = null)).`);

        this.main(this.ctx);
    }

    static emptyEnv() {
        this._current_env_ = null;
    }

    static main() {
        if (this._current_env_ == null)
            return console.warn('WARNING: There is no environment to run, running process interrupted.');

        Run.Update(this.ctx);
    }
}

class Run { /*(RUN) runs the "update" functions from different elements */
    static Update() {
        var { obj, tiles, ui } = Load._current_env_;
        tiles.forEach(e => e.update());
        obj.static_entities.forEach(e => e.update());
        obj.entities.forEach(e => e.update());
        ui.forEach(e => e.update());
        Control.Check();
    }
}

class Control { /* (CONTROL) verifies and fixes interactions between objects and elements in-game */
    static Check() {
        var ball = Load._current_env_.obj.entities;
        var wall = Load._current_env_.obj.static_entities;
        var pre_render_wall = true;
        //collision detection and position fix, then pre-rendering
        for (let i = 0; i < ball.length; i++) {
            if (!ball[i].collides) {
                var { pos, size, color, layer } = ball[i];
                View.PreRender({ pos: pos, size: size, color: color, layer: layer }, 'entity');
                continue;
            };
            OperandLoop:
            for (let j = 0; j < wall.length; j++) {
                if (pre_render_wall) {
                    var { pos, size, color, layer } = wall[j];
                    View.PreRender({ pos: pos, size: size, color: color, layer: layer }, 'staticentity');
                }
                if (!wall[j].collides) continue OperandLoop;

                var right = ball[i].pos.x + ball[i].size.x + ball[i].spd.x - wall[j].pos.x - wall[j].spd.x;
                var left = wall[j].pos.x + wall[j].size.x + wall[j].spd.x - ball[i].pos.x - ball[i].spd.x;
                var down = ball[i].pos.y + ball[i].size.y + ball[i].spd.y - wall[j].pos.y - wall[j].spd.y;
                var up = wall[j].pos.y + wall[j].size.y + wall[j].spd.y - ball[i].pos.y - ball[i].spd.y;
                
                /* replacing a REALLY long if statement | | |
                                                        V V V
                    ball[i].pos.x + ball[i].size.x + ball[i].spd.x >= wall[j].pos.x + wall[j].spd.x
                    && ball[i].pos.x + ball[i].spd.x <= wall[j].pos.x + wall[j].size.x + wall[j].spd.x
                    && ball[i].pos.y + ball[i].size.y + ball[i].spd.y >= wall[j].pos.y + wall[j].spd.y
                    && ball[i].pos.y + ball[i].spd.y <= wall[j].pos.y + wall[j].size.y + wall[j].spd.y
                    -
                    right after that, i should calculate all distances, but i did it already at the
                    beginning of the loop :) */
                if (right > 0 && left > 0 && down > 0 && up > 0) {
                    var functions = [];
                    var lesser = left;

                    if (right < lesser) lesser = right;

                    if (up < lesser) lesser = up;

                    if (down < lesser) lesser = down;

                    if (left == lesser) functions.push(function () {
                        ball[i].pos.x = wall[j].pos.x + wall[j].size.x - wall[j].spd.x;
                        ball[i].spd.x = 0;
                    });
                    else if (right == lesser) functions.push(function () {
                        ball[i].pos.x = wall[j].pos.x - ball[i].size.x - wall[j].spd.x;
                        ball[i].spd.x = 0;
                    });

                    if (up == lesser) functions.push(function () {
                        ball[i].pos.y = wall[j].pos.y + wall[j].size.y - wall[j].spd.y;
                        ball[i].spd.y = 0;
                    });
                    else if (down == lesser) functions.push(function () {
                        ball[i].pos.y = wall[j].pos.y - ball[i].size.y - wall[j].spd.y;
                        ball[i].spd.y = 0;
                    });

                    functions.forEach(func => func());
                }
            }
            var { pos, size, color, layer } = ball[i];
            View.PreRender({ pos: pos, size: size, color: color, layer: layer }, 'entity');
            if (pre_render_wall) pre_render_wall = false;
        }

        Load._current_env_.camera.update();
        View.Render();
    }
}

class View { /*(VIEW) prints objects to be rendered on the screen */
    static toRender = {
        tiles: [[], [], []],
        static_entities: [[], [], []],
        entities: [[], [], []],
        ui: [[], [], []]
    };
    static PreRender(sprite, type = '') {
        if (sprite.color === void 0) return;
        var i = sprite.layer;
        var path;
        switch (type.toLowerCase()) {
            case 'tile':
            case 'tiles':
                path = this.toRender.tiles;
                break;
            default:
                path = this.toRender.static_entities;
                break;
            case 'entity':
            case 'entities':
                path = this.toRender.entities;
                break;
            case 'ui':
                path = this.toRender.ui;
                break;
        }
        path[i].push(sprite);
    }
    static Render() {
        Load.ctx.clearRect(0, 0, this.screen_size.x, this.screen_size.y);
        this.Resize();
        //var elements = 0;
        for (let i = 0; i < 3; i++) {
            Load.ctx.translate(-Load._current_env_.camera.pos.x, -Load._current_env_.camera.pos.y);
            //Renders, but elements are not necessarily aligned with the camera (Objects, Players, NPCs...)
            this.toRender.tiles[i].forEach(e => {
                Load.ctx.fillStyle = e.color;
                Load.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
                //elements++;
            });
            this.toRender.static_entities[i].forEach(e => {
                Load.ctx.fillStyle = e.color;
                Load.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
                //elements++;
            });
            this.toRender.entities[i].forEach(e => {
                Load.ctx.fillStyle = e.color;
                Load.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
                //elements++;
            });
            Load.ctx.translate(Load._current_env_.camera.pos.x, Load._current_env_.camera.pos.y);
            //Renders, but elements are fixed on camera (GUI, UI...)
            this.toRender.ui[i].forEach(e => {
                Load.ctx.fillStyle = e.color;
                Load.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
                //elements++;
            });
        }
        this.Clear();
        window.requestAnimationFrame(() => Load.main());
    }
    static screen_size = { x: 800, y: 600 };
    static Resize() {
        Load.ctx.canvas.height = window.innerHeight;
        Load.ctx.canvas.width = window.innerHeight * 4 / 3;
        Load.ctx.scale(Load.ctx.canvas.width / this.screen_size.x, Load.ctx.canvas.height / this.screen_size.y);
    }
    static Clear() {
        /* I mean... this function is kind of unnecessary.
        BUT(T) I guess it'll do to make the clearing process more "automatic"
        Less typing, more results! */
        this.toRender.tiles = [[], [], []];
        this.toRender.static_entities = [[], [], []];
        this.toRender.entities = [[], [], []];
        this.toRender.ui = [[], [], []];
    }
}
class Input { /*(INPUT) works along the user's input (works using simple keyboard input) */
    static keys = new Map();
    static addKey(key) {
        if (this.keys.has(key)) return;
        this.keys.set(key, 0);
    }
    static removeKey(key) {
        if (this.keys.has(key)) this.keys.delete(key);
    }
    static _key_check_down_ = window.addEventListener('keydown', (event) => {
        var key = event.key.toString().toLowerCase();
        if (this.keys.has(key)) this.keys.set(key, 1);
    });
    static _key_check_up_ = window.addEventListener('keyup', (event) => {
        var key = event.key.toString().toLowerCase();
        if (this.keys.has(key)) this.keys.set(key, 0);
    });
    static keyPress(key) {
        key = key.toString().toLowerCase();
        this.addKey(key);
        return this.keys.get(key);
    }
}
const yes = (type = '') => { /*YES CODE!*/
    const YES = [
        'YY   Y  EEEEE   SSSS   !!',
        'YY   Y  EE  E  S   S  !!!',
        'YY   Y  EE     SS     !!',
        ' YY Y   EE  E  SSSS   !!',
        ' YY Y   EEEEE    SSS  !!',
        '  YY    EE  E     SS  !',
        '  YY    EE        SS  !',
        '  YY    EE  E  S  SS  ',
        ' YYY    EEEEE  SSSS   !!',
    ];
    var _console = console.log;
    switch (type.toLowerCase()) {
        case 'error':
            _console = console.error;
            break;
        case 'warn':
            _console = console.warn;
            break;
    }
    YES.forEach(str => _console(str));
    return 'YES!';
}

//-LOGIC-CLASSES-
class Environment {
    constructor({
        tiles = [],
        static_entities = [],
        entities = [],
        ui = [],
        camera = new Camera({}),
        quick = null,
        space_start = { x: -Infinity, y: -Infinity },
        space_end = { x: Infinity, y: Infinity }
    } = {}) {
        if (Array.isArray(quick)) {
            var tiles = [], static_entities = [], entities = [], ui = [];
            quick.forEach(e => {
                //if(e instanceof Tiles)
                //return tiles.push(e);
                if (e instanceof StaticEntity)
                    return static_entities.push(e);
                if (e instanceof Entity)
                    return entities.push(e);
                //if(e instanceof UI)
                //return ui.push(e);
                if (e instanceof Camera)
                    return camera = e;
                console.warn(`Warning: Element ${e} couldn't be added.`);
            })
        }
        this.tiles = tiles;
        this.obj = { static_entities: static_entities, entities: entities };
        this.ui = ui;
        this.camera = camera;
        this.space = { start: space_start, end: space_end };
    }
}
class Camera {
    constructor({
        target = {},
        pos = { x: 0, y: 0 },
        smooth = 2,
        distance = 0,
        dead = false
    } = {}) {
        this.pos = pos;
        this.target = target;
        this.smooth = Math.abs(smooth);
        this.distance = distance;
        this._dead_ = dead;
    }
    update() {
        if (this._dead_) return;
        var { pos = { x: 0, y: 0 }, size = { x: 0, y: 0 }, spd = { x: 0, y: 0 } } = this.target;
        var centerx = this.pos.x + View.screen_size.x / 2;
        var centery = this.pos.y + View.screen_size.y / 2;
        this.pos.x += (pos.x + size.x / 2 - centerx) / this.smooth;
        this.pos.y += (pos.y + size.y / 2 - centery) / this.smooth;
        if (spd.x == 0 && spd.y == 0) this.centralize = false;
        if (this.pos.x < Load._current_env_.space.start.x) this.pos.x = Load._current_env_.space.start.x;
        if (this.pos.y < Load._current_env_.space.start.y) this.pos.y = Load._current_env_.space.start.y;
        if (this.pos.x + View.screen_size.x > Load._current_env_.space.end.x)
            this.pos.x = Load._current_env_.space.end.x - View.screen_size.x;
        if (this.pos.y + View.screen_size.y > Load._current_env_.space.end.y)
            this.pos.y = Load._current_env_.space.end.y - View.screen_size.y;
    }
    newTarget(target = { pos: { x: 0, y: 0 }, size: { x: 0, y: 0 } }) {
        this.target = target;
    }
}
class TileMap {
    constructor({ map = [], source_map = new Map(), pos = { x: 0, y: 0 }, tile_size = { x: 0, y: 0 } } = {}) {
        this.source_map = source_map;
        this.map = map;
        this.pos = pos;
        this.tile_size = tile_size;
    }
    addTile({ key, src = '', start, end }) {
        if (key === void 0) return console.error(`Error: A tile can't be added with a key value "${key}"`);
        key = key.toString();
        if (key.length != 1) return console.error('Error: Tile keys should be 1 digit long.');
        if (src.isEmpty()) return console.warn(`Warning: "${key}" tile not added, source path is empty.`);
        if (start === void 0) start = { x: 0, y: 0 };
        if (end === void 0) end = { x: this.tile_size.x - 1, y: this.tile_size.y - 1 };
        var new_tile = { src: src, start: start, end: end };
        this.source_map.set(key, new_tile);
    }
}
class StaticEntity {
    constructor({
        name = 'blank',
        pos = { x: 0, y: 0 },
        size = { x: 0, y: 0 },
        spd = { x: 0, y: 0 },
        grv = 0,
        collides = false,
        color = null,
        layer = 0
    } = {}) {
        //mechanical properties
        this.name = name;
        this.pos = pos;
        this.size = size;
        this.spd = spd;
        this.grv = grv;
        this.collides = collides;
        //visual properties
        this.color = color
        this.layer = layer
    }
    update() {
        this.pos.x += this.spd.x;
        this.pos.y += this.spd.y;
        this.spd.y += this.grv;
    }
}
class Entity {
    constructor({
        name = 'blank',
        pos = { x: 0, y: 0 },
        size = { x: 0, y: 0 },
        spd = { x: 0, y: 0 },
        movspd = { x: 0, y: 0 },
        grv = 0,
        collides = false,
        color = null,
        layer = 0
    } = {}) {
        //mechanical properties
        this.name = name;
        this.pos = pos;
        this.size = size;
        this.spd = spd;
        this.movspd = movspd;
        this.grv = grv;
        this.collides = collides;
        //visual properties
        this.color = color
        this.layer = layer
    }
    update() {
        this.pos.x += this.spd.x;
        this.pos.y += this.spd.y;
        this.spd.y += this.grv;
    }
}
//Note: this class is still unfinished!!!
class Sprite {
    constructor({
        pos = { x: 0, y: 0 },
        size = { x: 0, y: 0 },
        color = null,
        src = null,
        frame = { x: 0, y: 0 }
    } = {}) {
        this.pos = pos;
        this.size = size;
        this.color = color;
        this.frame = frame;

        if (typeof src != 'string') src = '';
        this.src = src;
        this.current_set = null;
    }
    update(entity) {
        var { spd = { x: 0, y: 0 } } = entity;
        var { src = this.src, pos = this.pos, size = this.size } = this.current_set;
        if (typeof src != 'string' || !src.length > 0) src = this.src;
    }
}