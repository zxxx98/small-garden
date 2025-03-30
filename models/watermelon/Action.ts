import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export class Action extends Model
{
    static table = 'actions';

    @field('name') name: string;
    @field('time') time: number;
    @field('remark') remark?: string;
    @field('imgs') imgs?: string;
    @field('done') done: boolean;

    @relation('plants', 'plant_id') plant: any;

    // Helper methods for data conversion
    toJSON()
    {
        return {
            id: Number(this.id),
            name: this.name,
            plantId: this.plantId,
            time: this.time,
            remark: this.remark,
            imgs: this.imgs ? JSON.parse(this.imgs) : [],
            done: this.done
        };
    }

    get plantId(): string
    {
        return (this._raw as any).plant_id;
    }
}