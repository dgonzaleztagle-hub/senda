import React from 'react';
import type { School, Course, Appointment } from '../types';
import { CourseVisitStatus } from '../types';
import { CalendarIcon, ClockIcon, ClipboardListIcon } from '../constants';

interface CourseItemProps {
    school: School;
    course: Course;
    onScheduleVisit: () => void;
    statusInfo: { status: CourseVisitStatus, notes?: string };
    appointment?: Appointment;
    onUpdateStatus: (status: CourseVisitStatus, notes?: string) => void;
}

const statusStyles: Record<CourseVisitStatus, string> = {
    [CourseVisitStatus.Scheduled]: 'bg-green-100 text-green-800',
    [CourseVisitStatus.NotScheduled]: 'bg-gray-100 text-gray-800',
    [CourseVisitStatus.Rejected]: 'bg-red-100 text-red-800',
};

export const CourseItem: React.FC<CourseItemProps> = ({ course, onScheduleVisit, statusInfo, appointment, onUpdateStatus }) => {
    
    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                    <h4 className="font-bold text-gray-800">Curso {course.level} - {course.letter}</h4>
                     {appointment && statusInfo.status === CourseVisitStatus.Scheduled && (
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{appointment.dateTime.toLocaleDateString()}</span>
                                <ClockIcon className="w-4 h-4 ml-3 mr-2 flex-shrink-0" />
                                <span>{appointment.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {statusInfo.notes && (
                                <div className="flex items-start pt-1">
                                    <ClipboardListIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                                    <p className="italic text-gray-700">{statusInfo.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[statusInfo.status]}`}>
                        {statusInfo.status}
                    </span>
                    {statusInfo.status !== CourseVisitStatus.Scheduled ? (
                        <button onClick={onScheduleVisit} className="bg-teal-500 text-white px-3 py-1 rounded-md text-sm hover:bg-teal-600 transition">Agendar Visita</button>
                    ) : (
                        <button onClick={() => onUpdateStatus(CourseVisitStatus.NotScheduled)} className="bg-gray-400 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-500 transition">Cancelar</button>
                    )}
                    {statusInfo.status !== CourseVisitStatus.Rejected && (
                        <button onClick={() => onUpdateStatus(CourseVisitStatus.Rejected)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition">Rechazar</button>
                    )}
                </div>
            </div>
        </div>
    );
};