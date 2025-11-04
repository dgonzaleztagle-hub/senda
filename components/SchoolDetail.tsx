import React, { useState, useEffect } from 'react';
import type { School, Appointment, Course, Note } from '../types';
import { AppointmentType, CourseVisitStatus, SchoolContactStatus, SchoolManagementStatus } from '../types';
import { SchedulerModal } from './SchedulerModal';
import { CourseItem } from './CourseItem';
import { PhoneIcon, MailIcon, UserIcon, CalendarIcon, ClockIcon, MapPinIcon, EditIcon, SaveIcon, XIcon, ClipboardListIcon, CheckCircleIcon, ArrowLeftIcon } from '../constants';

interface SchoolDetailProps {
    school: School | null;
    onGoBack: () => void;
    allAppointments: Appointment[];
    schoolAppointments: Appointment[];
    onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
    onUpdateSchool: (updatedSchool: School) => void;
    onAddNote: (schoolId: number, noteContent: string) => void;
    schoolStatus?: SchoolContactStatus;
    courseStatusMap: Record<string, { status: CourseVisitStatus; notes?: string }>;
    onUpdateCourseStatus: (schoolId: number, courseId: string, status: CourseVisitStatus, notes?: string) => void;
    managementStatus?: SchoolManagementStatus;
    onUpdateManagementStatus: (schoolId: number, status: SchoolManagementStatus) => void;
}

const inputStyles = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const labelStyles = "block text-sm font-medium text-gray-700";

const NoteViewModal: React.FC<{ note: Note | null, onClose: () => void }> = ({ note, onClose }) => {
    if (!note) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">
                        Nota del {note.timestamp.toLocaleString()}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 whitespace-pre-wrap break-words">
                    {note.content}
                </div>
            </div>
        </div>
    );
};

export const SchoolDetail: React.FC<SchoolDetailProps> = ({ 
    school, onGoBack, allAppointments, schoolAppointments, onAddAppointment, onUpdateSchool, onAddNote, schoolStatus, courseStatusMap, onUpdateCourseStatus, managementStatus, onUpdateManagementStatus 
}) => {
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [schedulerContext, setSchedulerContext] = useState<{ type: AppointmentType; course?: Course }>({ type: AppointmentType.SchoolCall });
    const [isEditing, setIsEditing] = useState(false);
    const [editableSchool, setEditableSchool] = useState<School | null>(school);
    const [newNote, setNewNote] = useState('');
    const [viewingNote, setViewingNote] = useState<Note | null>(null);

    useEffect(() => {
        setEditableSchool(school);
        setIsEditing(false); // Salir del modo de edición al cambiar de colegio
    }, [school]);

    if (!school) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 h-full flex items-center justify-center text-center">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Seleccione un Colegio</h3>
                    <p className="mt-2 text-gray-500">Elija un colegio de la lista para ver sus detalles y agendar citas.</p>
                </div>
            </div>
        );
    }
    
    const openScheduler = (type: AppointmentType, course?: Course) => {
        setSchedulerContext({ type, course });
        setIsSchedulerOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editableSchool) return;
        const { name, value } = e.target;
        const isNumeric = ['latitude', 'longitude'].includes(name);
        setEditableSchool({ ...editableSchool, [name]: isNumeric ? parseFloat(value) || 0 : value });
    };

    const handleSave = () => {
        if (editableSchool) {
            onUpdateSchool(editableSchool);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditableSchool(school);
        setIsEditing(false);
    };

    const handleAddNote = () => {
        if (newNote.trim()) {
            onAddNote(school.code, newNote.trim());
            setNewNote('');
        }
    };
    
    const wazeUrl = `https://www.waze.com/ul?ll=${school.latitude}%2C${school.longitude}&navigate=yes`;
    const schoolContactCurrentStatus = schoolStatus || SchoolContactStatus.NotContacted;
    const currentManagementStatus = managementStatus || SchoolManagementStatus.Pending;
    const schoolVisits = schoolAppointments.filter(a => a.type === AppointmentType.SchoolVisit);
    const schoolCalls = schoolAppointments.filter(a => a.type === AppointmentType.SchoolCall);

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8">
                 <button
                    onClick={onGoBack}
                    className="flex items-center space-x-2 text-indigo-600 font-semibold mb-4 lg:hidden bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Volver a la lista</span>
                </button>
                
                {/* School Header */}
                <div className="flex justify-between items-start">
                    <div>
                        {isEditing ? (
                            <input type="text" name="name" value={editableSchool?.name || ''} onChange={handleInputChange} className={`${inputStyles} text-3xl font-extrabold tracking-tight`}/>
                        ) : (
                             <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{school.name}</h2>
                        )}
                        <p className="mt-1 text-lg text-gray-500">Código: {school.code}</p>
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="flex space-x-2">
                                <button onClick={handleSave} className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition">
                                    <SaveIcon className="w-5 h-5" />
                                </button>
                                <button onClick={handleCancel} className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                                <EditIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* School Info & Actions */}
                <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Información de Contacto</h3>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyles}>Director</label>
                                    <input type="text" name="director" value={editableSchool?.director || ''} onChange={handleInputChange} className={inputStyles}/>
                                </div>
                                <div>
                                    <label className={labelStyles}>Teléfono</label>
                                    <input type="text" name="phone" value={editableSchool?.phone || ''} onChange={handleInputChange} className={inputStyles}/>
                                </div>
                                <div>
                                    <label className={labelStyles}>Email</label>
                                    <input type="email" name="email" value={editableSchool?.email || ''} onChange={handleInputChange} className={inputStyles}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>Latitud</label>
                                        <input type="number" step="any" name="latitude" value={editableSchool?.latitude || ''} onChange={handleInputChange} className={inputStyles}/>
                                    </div>
                                    <div>
                                        <label className={labelStyles}>Longitud</label>
                                        <input type="number" step="any" name="longitude" value={editableSchool?.longitude || ''} onChange={handleInputChange} className={inputStyles}/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 text-gray-600">
                                <p className="flex items-center"><UserIcon className="w-5 h-5 mr-3 text-indigo-500"/> Director: {school.director}</p>
                                <p className="flex items-center"><PhoneIcon className="w-5 h-5 mr-3 text-indigo-500"/> {school.phone}</p>
                                <p className="flex items-center"><MailIcon className="w-5 h-5 mr-3 text-indigo-500"/> {school.email}</p>
                                <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200">
                                    <MapPinIcon className="w-5 h-5 mr-3"/> 
                                    <span>Ir con Waze ({school.latitude.toFixed(4)}, {school.longitude.toFixed(4)})</span>
                                </a>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Gestión del Colegio</h3>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Estado Contacto:</span>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                    schoolContactCurrentStatus === SchoolContactStatus.Contacted ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                                }`}>{schoolContactCurrentStatus}</span>
                           </div>
                           <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Estado Gestión:</span>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                    currentManagementStatus === SchoolManagementStatus.Completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>{currentManagementStatus}</span>
                           </div>
                           {currentManagementStatus === SchoolManagementStatus.Pending ? (
                                <button onClick={() => onUpdateManagementStatus(school.code, SchoolManagementStatus.Completed)} className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 text-sm font-medium">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span>Marcar como Terminada</span>
                                </button>
                           ) : (
                                <button onClick={() => onUpdateManagementStatus(school.code, SchoolManagementStatus.Pending)} className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium">
                                    Reabrir Gestión
                                </button>
                           )}
                           <div className="flex space-x-2 pt-2">
                            <button onClick={() => openScheduler(AppointmentType.SchoolCall)} className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-200 text-sm font-medium">Agendar Llamada</button>
                            <button onClick={() => openScheduler(AppointmentType.SchoolVisit)} className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-200 text-sm font-medium">Agendar Visita</button>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Scheduled Info */}
                {(schoolVisits.length > 0 || schoolCalls.length > 0) && (
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Actividades Agendadas</h3>
                        <div className="space-y-3">
                            {schoolCalls.map(call => (
                                <div key={call.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <div className="flex items-center">
                                        <PhoneIcon className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                                        <span>Llamada agendada para el {call.dateTime.toLocaleString()}</span>
                                    </div>
                                    {call.notes && (
                                        <div className="flex items-start pt-2 mt-2 border-t border-gray-200">
                                            <ClipboardListIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-gray-400" />
                                            <p className="italic text-gray-700">{call.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {schoolVisits.map(visit => (
                                <div key={visit.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                                        <span>Visita agendada para el {visit.dateTime.toLocaleString()}</span>
                                    </div>
                                    {visit.notes && (
                                        <div className="flex items-start pt-2 mt-2 border-t border-gray-200">
                                            <ClipboardListIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-gray-400" />
                                            <p className="italic text-gray-700">{visit.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Notes Section */}
                <div className="border-t border-gray-200 pt-6">
                     <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <ClipboardListIcon className="w-5 h-5 mr-3"/>
                        Notas
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <textarea
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                rows={3}
                                placeholder="Escriba una nueva nota aquí..."
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <button
                                onClick={handleAddNote}
                                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
                            >
                                Agregar Nota
                            </button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {school.notes.length > 0 ? school.notes.map(note => (
                                <button key={note.id} onClick={() => setViewingNote(note)} className="w-full text-left bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                                    <p className="text-xs text-gray-500">{note.timestamp.toLocaleString()}</p>
                                    <p className="text-sm text-gray-800 mt-1 truncate">{note.content}</p>
                                </button>
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">No hay notas para este colegio.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Courses List */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Cursos</h3>
                    <div className="space-y-4">
                        {school.courses.map(course => (
                            <CourseItem
                                key={course.id}
                                school={school}
                                course={course}
                                onScheduleVisit={() => openScheduler(AppointmentType.CourseVisit, course)}
                                statusInfo={courseStatusMap[`${school.code}-${course.id}`] || { status: CourseVisitStatus.NotScheduled }}
                                appointment={schoolAppointments.find(a => a.courseId === course.id)}
                                onUpdateStatus={(status, notes) => onUpdateCourseStatus(school.code, course.id, status, notes)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <SchedulerModal
                isOpen={isSchedulerOpen}
                onClose={() => setIsSchedulerOpen(false)}
                onSchedule={onAddAppointment}
                school={school}
                context={schedulerContext}
                allAppointments={allAppointments}
            />
            <NoteViewModal note={viewingNote} onClose={() => setViewingNote(null)} />
        </>
    );
};