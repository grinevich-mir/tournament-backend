import { Singleton } from '../../core/ioc';
import _ from 'lodash';
import { LogClass } from '../../core/logging';

const COLOURS = ['Amber', 'Amethyst', 'Apricot', 'Aquamarine', 'Azure', 'Beige', 'Black', 'Blue', 'Blush', 'Bronze', 'Brown', 'Burgundy', 'Byzantium', 'Carmine', 'Cerise', 'Cerulean', 'Champagne', 'Chocolate', 'Cobalt', 'Coffee', 'Copper', 'Coral', 'Crimson', 'Cyan', 'Emerald', 'Erin', 'Gold', 'Gray', 'Green', 'Harlequin', 'Indigo', 'Ivory', 'Jade', 'Jungle', 'Lavender', 'Lemon', 'Lilac', 'Lime', 'Magenta', 'Maroon', 'Mauve', 'Navy', 'Ochre', 'Olive', 'Orange', 'Orchid', 'Peach', 'Pear', 'Periwinkle', 'Pink', 'Plum', 'Puce', 'Purple', 'Raspberry', 'Red', 'Rose', 'Ruby', 'Salmon', 'Sangria', 'Sapphire', 'Scarlet', 'Silver', 'Slate', 'Tan', 'Taupe', 'Teal', 'Turquoise', 'Ultramarine', 'Violet', 'Viridian', 'White', 'Yellow'];
const THINGS = ['Scissors', 'Dice', 'Chip', 'Pencil', 'Fan', 'Mouse', 'Lamp', 'Card', 'Ball', 'Car', 'Bicycle', 'Truck', 'Bus', 'Wheel', 'Face', 'Clock', 'Watch', 'Anvil', 'Sky', 'Cloud', 'Bird', 'Dog', 'Cat', 'Tree', 'Flower', 'Flag'];

@Singleton
@LogClass()
export class DisplayNameGenerator {
    public generate(): string {
        const colour = _.sample(COLOURS);
        const thing = _.sample(THINGS);
        return `${colour} ${thing}`;
    }
}