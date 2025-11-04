import React, { useState, useEffect } from 'react';
import type { School, Course, Appointment } from '../types';
import { AppointmentType } from '../types';
import { XIcon } from '../constants';

interface SchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (appointment: Omit<Appointment, 'id'>) => void;
    school: School;
    context: { type: AppointmentType; course?: Course };
    allAppointments: Appointment[];
}

export const SchedulerModal: React.FC<SchedulerModalProps> = ({ isOpen, onClose, onSchedule, school, context, allAppointments }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [time, setTime] = useState('09:00');
    const [notes, setNotes] = useState('');
    const [conflict, setConflict] = useState<Appointment | null>(null);

    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setTime('09:00');
            setNotes('');
            setConflict(null);
        }
    }, [isOpen]);

    const checkForConflict = (proposedDateTime: Date): Appointment | null => {
        const twoHours = 2 * 60 * 60 * 1000;
        const proposedTime = proposedDateTime.getTime();
        const lowerBound = proposedTime - twoHours;
        const upperBound = proposedTime + twoHours;
        
        return allAppointments.find(app => {
            if (app.type === AppointmentType.SchoolCall) return false; // Calls don't conflict
            const existingTime = app.dateTime.getTime();
            return existingTime > lowerBound && existingTime < upperBound;
        }) || null;
    };
    
    const handleSubmit = (force: boolean = false) => {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);

        if (!force) {
            const conflictAppointment = checkForConflict(scheduledDateTime);
            if (conflictAppointment) {
                setConflict(conflictAppointment);
                return;
            }
        }
        
        onSchedule({
            schoolId: school.code,
            courseId: context.course?.id,
            type: context.type,
            dateTime: scheduledDateTime,
            notes,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                        Agendar: {context.type}
                        {context.course && ` - Curso ${context.course.level}-${context.course.letter}`}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6">
                    {conflict ? (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                            <h4 className="font-bold text-yellow-800">¡Conflicto de Agendamiento Detectado!</h4>
                            <p className="mt-2 text-sm text-yellow-700">
                                Ya existe una visita agendada para el <strong>{conflict.dateTime.toLocaleString()}</strong>.
                                Esto está dentro del rango de 2 horas de la hora seleccionada.
                            </p>
                            <div className="mt-4 flex justify-end space-x-3">
                                <button onClick={() => setConflict(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cambiar Hora</button>
                                <button onClick={() => handleSubmit(true)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-600">Agendar de Todas Formas</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha</label>
                                    <input type="date" id="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">Hora</label>
                                    <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas</label>
                                <textarea id="notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                                <button onClick={() => handleSubmit(false)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Confirmar Agendamiento</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};