//By Levi Sales

/*
Tip: this code is just sample code
You can basically add, remove and edit entities the way you want
Have fun, I guess!
*/

class Player extends Entity {
    constructor({
        name='blank',
        pos={x:0, y:0},
        size={x:0, y:0},
        spd={x:0, y:0},
        movspd={x:0, y:0},
        grv=0.1,
        collides=false,
        color=null,
        layer=0
    }={}) {
        super({
            name:name,
            pos:pos,
            spd:spd,
            size:size,
            movspd:movspd,
            grv:grv,
            collides:collides,
            color:color,
            layer:layer
        });
        //extra-mechanical properties
        this.jumpswitch = true;
    }
    update() {
        this.pos.x += this.spd.x;
        this.pos.y += this.spd.y;
        this.spd.y += this.grv;
        var mov = (Input.keyPress('d')||Input.keyPress('arrowright')) - (Input.keyPress('a')||Input.keyPress('arrowleft'));
        this.spd.x = mov * this.movspd.x;
        mov = Input.keyPress('w')||Input.keyPress('arrowup');
        if(mov) this.spd.y = -this.movspd.y
    }
}
function Lvl01() {
    const player = new Player({
        name:'Levi',
        pos:{x:50, y:50},
        size:{x:50, y:50},
        movspd: {x:10, y:10},
        collides:true,
        color:'blue',
        grv:1,
        layer:1,
    });
    const lucas = new Entity({
        name:'Lucas',
        pos:{x:700, y:50},
        size:{x:50, y:50},
        movspd: {x:10, y:10},
        collides:true,
        color:'yellow',
        grv:1,
        layer:0,
    })
    const ground = new StaticEntity({
        name:'ground',
        pos:{x:0, y:300},
        size:{x:1600, y:300},
        layer:0,
        color:'#C9781C',
        collides:true
    });
    const env = new Environment({
        quick:[
            player,
            ground,
            lucas,
            new StaticEntity({
                pos:{x:500, y:200},
                size: {x:500, y:150},
                collides:true,
                color:'#C9781C',
            }),
            new StaticEntity({
                pos:{x:1000, y:200},
                size: {x:100, y:150},
                collides:true,
                color:'#C9781C',
            }),
            new StaticEntity({
                pos:{x:1000, y:200},
                size: {x:100, y:150},
                collides:true,
                color:'#C9781C',
            }),
            new Camera({target:player, distance:0, smooth:12})
        ],
        space_start: {x:0, y:-1200},
        space_end: {x:1600, y:600}
    });
    Load.newEnv('Mundo1', env);
    Load.setEnv('Mundo1');
    Load.runEnv();
}
Lvl01();