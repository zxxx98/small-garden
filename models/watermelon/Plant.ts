import { Model } from '@nozbe/watermelondb';
import { field, children, date, readonly } from '@nozbe/watermelondb/decorators';

export class Plant extends Model
{
    static table = 'plants';

    @field('name') name: string;
    @field('type') type: string;
    @field('scientific_name') scientificName?: string;
    @field('remark') remark?: string;
    @field('img') img?: string;
    @field('is_dead') isDead: boolean;

    @children('actions') actions: any;

    // Helper methods for data conversion
    toJSON()
    {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            scientificName: this.scientificName,
            remark: this.remark,
            img: this.img,
            isDead: this.isDead
        };
    }
}