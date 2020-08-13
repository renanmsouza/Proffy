import { Request, Response } from 'express'

import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface SchedulerItem {
    week_day: number;
    from: string;
    to: string;
}

class ClassesController {
    async index (req: Request, res: Response) {
        const filters = req.query;

        const subject = filters.subject as string || '';
        const week_day = filters.week_day as string || '';
        const time = filters.hour as string || '00:00';

        const timeInMiniutes = convertHourToMinutes(time);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_scheduler.*')
                .from('class_scheduler')
                .whereRaw('`class_scheduler`.`class_id` = `classes`.`id`')
                .whereRaw('`class_scheduler`.`week_day` = ??', [Number(week_day)])
                .whereRaw('`class_scheduler`.`from` <= ??', [Number(timeInMiniutes)])
                .whereRaw('`class_scheduler`.`to` > ??', [Number(timeInMiniutes)])
            })
            .where('classes.subject', '=' , subject)
            .join('users', 'users.id', '=', 'classes.user_id')
            .select(['classes.*', 'users.*'])

        return res.json(classes);
    }

    async create (req: Request, res: Response) {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = req.body;
    
        const trx = await db.transaction();
    
        try{
            const insertedUsesIds = await trx('users').insert({
                name, avatar, whatsapp, bio
            })
    
            const user_id = insertedUsesIds[0];
    
            const insertedClassesIds = await trx('classes').insert({
                subject, cost, user_id
            })
    
            const class_id = insertedClassesIds[0];
    
            const classScheduler = schedule.map((schedulerItem: SchedulerItem) => {
                return {
                    class_id,
                    week_day: schedulerItem.week_day,
                    from: convertHourToMinutes(schedulerItem.from),
                    to: convertHourToMinutes(schedulerItem.to),
                }
            } );
            
            await trx('class_scheduler').insert(classScheduler);
    
            await trx.commit();
    
            return res.status(201).json([]);
        }catch{
            await trx.rollback();
    
            return res.status(400).json([]);
        }
    }
}

export default ClassesController;