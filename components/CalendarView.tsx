import React, { useState, useMemo } from 'react';
import type { School, Appointment } from '../types';
import { AppointmentType } from '../types';
import { ArrowLeftIcon, XIcon, ClockIcon, BuildingIcon } from '../constants';

interface CalendarViewProps {
    appointments: Appointment[];
    schools: School[];
    onSelectSchool: (school: School) => void;
    setActiveTab: (tab: 'agenda') => void;
}

const CalendarModal: React.FC<{
    selectedDate: Date;
    appointments: Appointment[];
    schoolMap: Map<number, School>;
    onClose: () => void;
    onSelectAppointment: (appointment: Appointment) => void;
}> = ({ selectedDate, appointments, schoolMap, onClose, onSelectAppointment }) => {
    
    const sortedAppointments = [...appointments].sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">
                        Agenda para {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {sortedAppointments.length > 0 ? sortedAppointments.map(app => {
                        const school = schoolMap.get(app.schoolId);
                        return (
                            <button key={app.id} onClick={() => onSelectAppointment(app)} className="w-full text-left bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                                <div className="flex items-center text-sm font-semibold text-indigo-700">
                                    <ClockIcon className="w-4 h-4 mr-2" />
                                    <span>{app.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center mt-2 text-gray-800">
                                     <BuildingIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>{school?.name || 'Colegio no encontrado'}</span>
                                </div>
                                {app.type === AppointmentType.CourseVisit && app.courseId && (
                                    <p className="text-xs text-gray-500 mt-1 ml-6">Curso: {app.courseId.replace('-', ' ')}</p>
                                )}
                            </button>
                        );
                    }) : (
                        <p className="text-gray-500 text-center py-4">No hay visitas agendadas para este día.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


export const CalendarView: React.FC<CalendarViewProps> = ({ appointments, schools, onSelectSchool, setActiveTab }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const schoolMap = useMemo(() => new Map(schools.map(s => [s.code, s])), [schools]);

    const appointmentsByDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        appointments.forEach(app => {
            if (app.type === AppointmentType.SchoolCall) return; // Calls don't have a physical location/time conflict
            
            const dateKey = app.dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(app);
        });
        return map;
    }, [appointments]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay(); // 0=Sunday, 1=Monday...
    const daysInMonth = endOfMonth.getDate();
    
    const calendarDays = [];
    // Padding for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push({ key: `pad-start-${i}`, isPadding: true });
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        calendarDays.push({
            key: dateKey,
            date,
            day,
            isToday: dateKey === new Date().toISOString().split('T')[0],
            hasAppointments: appointmentsByDate.has(dateKey),
        });
    }
    // Padding for next month
     const endDayOfWeek = endOfMonth.getDay();
     const paddingEndCount = 6 - endDayOfWeek;
     for (let i = 0; i < paddingEndCount; i++) {
         calendarDays.push({ key: `pad-end-${i}`, isPadding: true });
     }


    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleSelectAppointment = (appointment: Appointment) => {
        const school = schoolMap.get(appointment.schoolId);
        if (school) {
            onSelectSchool(school);
            setActiveTab('agenda');
        }
        setSelectedDate(null);
    };

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return (
        <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
             <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600"/>
                </button>
                <h2 className="text-lg font-bold text-gray-800 capitalize">
                    {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeftIcon className="w-5 h-5 text-gray-600 transform rotate-180"/>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-px p-2 text-center text-sm font-semibold text-gray-500">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px p-2 flex-grow">
                 {calendarDays.map(day => 
                    day.isPadding ? <div key={day.key}></div> : (
                        <button 
                            key={day.key}
                            onClick={() => day.hasAppointments && setSelectedDate(day.date)}
                            disabled={!day.hasAppointments}
                            className={`relative flex items-center justify-center p-2 rounded-lg text-sm transition-colors ${
                                day.isToday ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-700'
                            } ${day.hasAppointments ? 'cursor-pointer hover:bg-gray-100' : 'text-gray-400'}`}
                        >
                            <span>{day.day}</span>
                            {day.hasAppointments && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                        </button>
                    )
                 )}
            </div>
            {selectedDate && appointmentsByDate.has(selectedDate.toISOString().split('T')[0]) && (
                <CalendarModal 
                    selectedDate={selectedDate}
                    appointments={appointmentsByDate.get(selectedDate.toISOString().split('T')[0]) || []}
                    schoolMap={schoolMap}
                    onClose={() => setSelectedDate(null)}
                    onSelectAppointment={handleSelectAppointment}
                />
            )}
        </div>
    );
};
