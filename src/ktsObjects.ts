import Zepr = require('zepr.ts');

import { P2Screen, ActionSprite, Animation, SimpleAnimation, Material } from "./p2Link";




export interface Scene {
    color: string;
    description: string;
    objects: Array<ObjectDefinition>;
    spare: Array<SpareObjectDefinition>;
}

export interface ObjectDefinition {
    type: string;
    x: number;
    y: number;
    rotation?: number;
    fixed?: boolean;
    active?: boolean;
    dependencies?: Array<ObjectDefinition>;
}

export interface SpareObjectDefinition {
    type: string;
    rotation?: number;
}



interface AnimationDef {
    defaultSet: string | Array<string>;
    activeSet?: string | Array<string>
}

interface RectangleDimensions {
    width: number,
    height: number,
    mass: number
}

interface CircleDimensions {
    radius: number,
    mass: number
}

interface ObjectAction {
    area: Zepr.Circle | Zepr.Rectangle,
    action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite) => void
}


export class ObjectFactory {

    private constructor() {}

    public static readonly OBJECTS: Array<string> = [
        'wall', 'swing', 'pin', 'shadok', 'mace', 'pikes', 
        'balloon', 'ball', 'dryer', 'vacuum', 'trap', 'lrunner', 
        'rrunner', 'trampo', 'elec', 'button'
    ];

    private static readonly DIMENSIONS: Map<string, RectangleDimensions | CircleDimensions> = new Map([
        ['wall', { width: 85, height: 11, mass: 0 }],
        ['swing', { width: 106, height: 10, mass: 0 }],
        ['pin', { radius: 5.5, mass: 0 }],
        ['shadok', { radius: 35, mass: 0 }],
        ['mace', { radius: 20, mass: 10 }],
        ['pikes', { width: 65, height: 12, mass: 0 }],
        ['balloon', { radius: 20, mass: -1 }],
        ['ball', { radius: 21, mass: 1 }],
        ['dryer', { width: 42, height: 16, mass: 0 }],
        ['vacuum', { width: 32, height: 42, mass: 0 }],
        ['trap', { width: 90, height: 12, mass: 0 }],
        ['lrunner', { width: 78, height: 16, mass: 0 }],
        ['rrunner', { width: 78, height: 16, mass: 0 }],
        ['trampo', { width: 58, height: 34, mass: 0 }],
        ['elec', { width: 86, height: 12, mass: 0 }],
        ['button', { width: 22, height: 12, mass: 0 }]
    ]);

    private static readonly ANIMATIONS: Map<string, AnimationDef> = new Map([
        ['wall', { defaultSet: 'images/block.png' }],
        ['swing', { defaultSet: 'images/swing.png'}],
        ['pin', { defaultSet: 'images/pin.png'}],
        ['shadok', { defaultSet: 'images/shadok.png'}],
        ['mace', { defaultSet: 'images/mace.png'}],
        ['pikes', { defaultSet: 'images/pikes.png'}],
        ['balloon', { defaultSet: 'images/balloon.png'}],
        ['ball', { defaultSet: 'images/ball.png'}],
        ['dryer', { defaultSet: 'images/dryer.png', activeSet: ['images/dryer_a1.png', 'images/dryer_a2.png', 'images/dryer_a3.png', 'images/dryer_a4.png']}],
        ['vacuum', { defaultSet: 'images/vacuum.png', activeSet: ['images/vacuum_a1.png', 'images/vacuum_a2.png', 'images/vacuum_a3.png', 'images/vacuum_a4.png']}],
        ['trap', { defaultSet: 'images/trap.png', activeSet: 'images/trap_a.png'}],
        ['lrunner', { defaultSet: 'images/lrunner_a1.png', activeSet: ['images/lrunner_a1.png', 'images/lrunner_a2.png', 'images/lrunner_a3.png', 'images/lrunner_a4.png']}],
        ['rrunner', { defaultSet: 'images/rrunner_a1.png', activeSet: ['images/rrunner_a1.png', 'images/rrunner_a2.png', 'images/rrunner_a3.png', 'images/rrunner_a4.png']}],
        ['trampo', { defaultSet: 'images/trampo.png'}],
        ['elec', { defaultSet: 'images/elec.png', activeSet: ['images/elec_a1.png', 'images/elec_a2.png', 'images/elec_a3.png', 'images/elec_a4.png']}],
        ['button', { defaultSet: 'images/button.png', activeSet: 'images/button_a.png'}]
    ]);

    private static readonly ACTIONS: Map<string, ObjectAction> = new Map([
        ['mace', { area: new Zepr.Circle(0, 0, 25), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            if (sprite.type == 'shadok' || sprite.type == 'balloon') {
                screen.removeActionSprite(sprite);
            }
        }}],
        ['pikes', { area: new Zepr.Rectangle(0, -10, 61, 8), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            if (sprite.type == 'shadok' || sprite.type == 'balloon') {
                screen.removeActionSprite(sprite);
            }
        }}],
        ['dryer', { area: new Zepr.Rectangle(-50, 0, 60, 20), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            let v: Zepr.Vector = new Zepr.Vector(-50, 0).rotateRad(self.getActionRotationRad());                
            sprite.addForce(v);
        }}],
        ['vacuum', { area: new Zepr.Rectangle(0, 50, 20, 60), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            let v: Zepr.Vector = new Zepr.Vector(0, -50).rotateRad(self.getActionRotationRad());                
            sprite.addForce(v);
        }}],
        ['lrunner', { area: new Zepr.Rectangle(0, 0, 72, 20), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            // Find position (top/bottom) of object to adjust direction
            let v1: Zepr.Vector = new Zepr.Vector(0, -1).rotateRad(self.getRotationRad());
            let v2: Zepr.Vector = new Zepr.Vector(sprite.getX() - self.getX(), sprite.getY() - self.getY());
            let dot: number = v1.getDotProduct(v2);

            let v: Zepr.Vector = new Zepr.Vector(dot > 0 ? -40 : 40, 0).rotateRad(self.getActionRotationRad());
            sprite.addForce(v);            
        }}],
        ['rrunner', { area: new Zepr.Rectangle(0, 0, 72, 20), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            // Find position (top/bottom) of object to adjust direction
            let v1: Zepr.Vector = new Zepr.Vector(0, -1).rotateRad(self.getRotationRad());
            let v2: Zepr.Vector = new Zepr.Vector(sprite.getX() - self.getX(), sprite.getY() - self.getY());
            let dot: number = v1.getDotProduct(v2);

            let v: Zepr.Vector = new Zepr.Vector(dot > 0 ? 40 : -40, 0).rotateRad(self.getActionRotationRad());
            sprite.addForce(v);            
        }}],
        ['elec', { area: new Zepr.Rectangle(0, 0, 90, 16), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            if (sprite.type == 'shadok') {
                screen.removeActionSprite(sprite);
            }
        }}],
        ['button', { area: new Zepr.Rectangle(0, -9, 16, 6), action: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite): void => {
            if (screen.isStatic(sprite)) return;
            self.setActive(false);
            // Activate dependencies
            self.getDependencies().forEach((as: ActionSprite): void => {
                as.setActive(!as.isActive());
            });
        }}]
    ]);

    private static readonly ACTIVATIONS: Map<string, (screen: P2Screen, self: ActionSprite, isActive: boolean) => void> = new Map([
        ['trap', (screen: P2Screen, self: ActionSprite, isActive: boolean): void => { screen.updateMass(self, isActive ? 1 : 0); }],
        ['swing', (screen: P2Screen, self: ActionSprite, isActive: boolean): void => { screen.updateMass(self, isActive ? 1 : 0); }],
        ['shadok', (screen: P2Screen, self: ActionSprite, isActive: boolean): void => { screen.updateMass(self, isActive ? 2 : 0); }]
    ]);


    private static readonly PIVOTS: Map<string, Zepr.Point> = new Map([
        ['swing', new Zepr.Point(0, 0)],
        ['trap', new Zepr.Point(-40, 0)]
    ]);


    private static readonly MATERIALS: Map<string, Material> = new Map([
        ['wall', Material.Standard],
        ['swing', Material.Standard],
        ['pin', Material.Standard],
        ['shadok', Material.Standard],
        ['mace', Material.Standard],
        ['pikes', Material.Standard],
        ['balloon', Material.Standard],
        ['ball', Material.Standard],
        ['dryer', Material.Standard],
        ['vacuum', Material.Standard],
        ['trap', Material.Standard],
        ['lrunner', Material.Standard],
        ['rrunner', Material.Standard],
        ['trampo', Material.Bouncy],
        ['elec', Material.Standard],
        ['button', Material.Standard]
    ]);

    public static getImage(type: string): string {
        let anim: string | Array<string> = ObjectFactory.ANIMATIONS.get(type).defaultSet;
        if (anim == null) return null;

        let spriteImage: string;
        if (anim instanceof Array) {
            spriteImage = anim[0];
        } else {
            spriteImage = anim;
        }

        return spriteImage;
    }



    public static getShape(type: string): Zepr.Circle | Zepr.Rectangle {
        let dimDef: RectangleDimensions | CircleDimensions = ObjectFactory.DIMENSIONS.get(type);
        if (dimDef == null) return null; // Unknown object type

        let shape: Zepr.Circle | Zepr.Rectangle;
        if ((<any>dimDef).width) {
            // Rectangle
            shape = new Zepr.Rectangle(0, 0, (<RectangleDimensions>dimDef).width, (<RectangleDimensions>dimDef).height)
        } else {
            // Circle
            shape = new Zepr.Circle(0, 0, (<CircleDimensions>dimDef).radius);
        }

        return shape;
    }



    public static getActionSprite(engine: Zepr.Engine, screen: P2Screen, def: ObjectDefinition): ActionSprite {
        
        let sprite: ActionSprite;

        // Shape and mass
        let dimDef: RectangleDimensions | CircleDimensions = ObjectFactory.DIMENSIONS.get(def.type);
        if (dimDef == null) return null; // Unknown object type

        let mass: number = dimDef.mass;
        if (def.fixed) {
            mass = 0;
        }

        let shape: Zepr.Circle | Zepr.Rectangle;
        if ((<any>dimDef).width) {
            // Rectangle
            shape = new Zepr.Rectangle(def.x, def.y, (<RectangleDimensions>dimDef).width, (<RectangleDimensions>dimDef).height)
        } else {
            // Circle
            shape = new Zepr.Circle(def.x, def.y, (<CircleDimensions>dimDef).radius);
        }

        // Animation
        let animDef: AnimationDef = ObjectFactory.ANIMATIONS.get(def.type);
        let defaultSet: Array<HTMLImageElement> = new Array<HTMLImageElement>();
        if (animDef.defaultSet instanceof Array) { // Array<string>
            animDef.defaultSet.forEach((s: string): void => {
                defaultSet.push(engine.getImage(s));
            });
        } else { // string
            defaultSet.push(engine.getImage(animDef.defaultSet));
        }

        let activeSet: Array<HTMLImageElement> = null;
        if (animDef.activeSet != null) {
            activeSet = new Array<HTMLImageElement>();
            if (animDef.activeSet instanceof Array) { // Array<string>
                animDef.activeSet.forEach((s: string): void => {
                    activeSet.push(engine.getImage(s));
                });
            } else { // string
                activeSet.push(engine.getImage(animDef.activeSet));
            }    
        }

        let animation: Animation = new SimpleAnimation(
            defaultSet, activeSet
        );

        // Start construction
        sprite = new ActionSprite(
            def.type,
            shape,
            animation,
            def.active,
            ObjectFactory.PIVOTS.get(def.type),
            ObjectFactory.MATERIALS.get(def.type)
        );
        
        // Rotation
        if (def.rotation) {
            sprite.setRotation(def.rotation);
        }

        // Add action (if any)
        let actionDef: ObjectAction = ObjectFactory.ACTIONS.get(def.type);
        if (actionDef != null) {
            sprite.setAction(
                actionDef.area, actionDef.action
            );
        }

        // Add activation behavior (if any)
        sprite.onActivation(ObjectFactory.ACTIVATIONS.get(def.type));

        // Check for dependencies
        if (def.dependencies != null) {
            let dep: ActionSprite;
            def.dependencies.forEach((depDef : ObjectDefinition): void => {
                dep = ObjectFactory.getActionSprite(engine, screen, depDef);
                sprite.addDependency(dep);
            });
        }

        // Add to screen
        screen.addActionSprite(sprite, mass);

        return sprite;
    }
}