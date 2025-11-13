import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { School, Appointment, Course, RawSchoolData, Note } from './types';
import { AppointmentType, CourseVisitStatus, SchoolContactStatus, SchoolManagementStatus } from './types';
import { extractSchoolDataFromImage, processRawData } from './services/geminiService';
import { SchoolList } from './components/SchoolList';
import { SchoolDetail } from './components/SchoolDetail';
import { BuildingIcon } from './constants';
import { CalendarView } from './components/CalendarView';

const LOCAL_STORAGE_KEY = 'schoolSchedulerAppState';

const App: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [schoolStatus, setSchoolStatus] = useState<Record<number, SchoolContactStatus>>({});
    const [managementStatus, setManagementStatus] = useState<Record<number, SchoolManagementStatus>>({});
    const [courseStatus, setCourseStatus] = useState<Record<string, { status: CourseVisitStatus; notes?: string }>>({});
    
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'agenda' | 'calendario'>('agenda');

    const loadInitialData = useCallback(async () => {
        try {
            const rawData: RawSchoolData[] = await extractSchoolDataFromImage();
            const processedData: School[] = processRawData(rawData);
            setSchools(processedData);

            const initialManagementStatus: Record<number, SchoolManagementStatus> = {};
            processedData.forEach(school => {
                if (school.code === 10645) {
                     initialManagementStatus[school.code] = SchoolManagementStatus.Completed;
                } else {
                    initialManagementStatus[school.code] = SchoolManagementStatus.Pending;
                }
            });
            setManagementStatus(initialManagementStatus);
        } catch (err) {
            setError('Error al cargar los datos de los colegios.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect for loading data from localStorage or fetching on initial mount
    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                
                const rehydratedAppointments = (savedState.appointments || []).map((app: any) => ({
                    ...app,
                    dateTime: new Date(app.dateTime),
                }));
                const rehydratedSchools = (savedState.schools || []).map((school: any) => ({
                    ...school,
                    notes: (school.notes || []).map((note: any) => ({
                        ...note,
                        timestamp: new Date(note.timestamp),
                    })),
                }));

                setSchools(rehydratedSchools);
                setAppointments(rehydratedAppointments);
                setSchoolStatus(savedState.schoolStatus || {});
                setCourseStatus(savedState.courseStatus || {});
                
                // Synchronize management status to ensure all schools have an entry
                const loadedManagementStatus = savedState.managementStatus || {};
                const synchronizedManagementStatus: Record<number, SchoolManagementStatus> = {};
                rehydratedSchools.forEach((school: School) => {
                    synchronizedManagementStatus[school.code] = loadedManagementStatus[school.code] || SchoolManagementStatus.Pending;
                });
                setManagementStatus(synchronizedManagementStatus);


                // Don't re-select school on mobile to show the list first
                const isMobile = window.innerWidth < 1024; // Tailwind's lg breakpoint
                if (savedState.selectedSchoolCode && !isMobile) {
                    const foundSchool = rehydratedSchools.find((s: School) => s.code === savedState.selectedSchoolCode);
                    setSelectedSchool(foundSchool || null);
                }
                setIsLoading(false);
            } else {
                loadInitialData();
            }
        } catch (err) {
            console.error("Error al cargar estado. Restaurando a datos iniciales.", err);
            setError('Error al cargar datos guardados. Se restauraron los datos originales.');
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            loadInitialData();
        }
    }, [loadInitialData]); 

    // Effect for saving state to localStorage whenever it changes
    useEffect(() => {
        if (isLoading) {
            return; // Don't save during the initial data load
        }
        try {
            const stateToSave = {
                schools,
                appointments,
                schoolStatus,
                managementStatus,
                courseStatus,
                selectedSchoolCode: selectedSchool?.code || null,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [schools, appointments, schoolStatus, managementStatus, courseStatus, selectedSchool, isLoading]);
    
    const handleSelectSchool = (school: School | null) => {
        setSelectedSchool(school);
    };

    const addAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
        const appointmentWithId: Appointment = { ...newAppointment, id: crypto.randomUUID() };
        setAppointments(prev => [...prev, appointmentWithId]);

        // Update status based on new appointment
        if (newAppointment.type === AppointmentType.CourseVisit && newAppointment.courseId) {
            setCourseStatus(prev => ({
                ...prev,
                [`${newAppointment.schoolId}-${newAppointment.courseId}`]: { status: CourseVisitStatus.Scheduled, notes: newAppointment.notes }
            }));
        } else if (newAppointment.type === AppointmentType.SchoolCall || newAppointment.type === AppointmentType.SchoolVisit) {
            setSchoolStatus(prev => ({
                ...prev,
                [newAppointment.schoolId]: SchoolContactStatus.Contacted
            }));
        }
    };
    
    const updateCourseStatus = (schoolId: number, courseId: string, status: CourseVisitStatus, notes?: string) => {
         setCourseStatus(prev => ({
            ...prev,
            [`${schoolId}-${courseId}`]: { status, notes }
        }));
        if(status === CourseVisitStatus.Scheduled) return;
        // Remove appointment if status is changed to rejected or not scheduled
        setAppointments(prev => prev.filter(app => !(app.schoolId === schoolId && app.courseId === courseId)));
    };

    const handleUpdateSchool = (updatedSchool: School) => {
        setSchools(prevSchools => 
            prevSchools.map(school => 
                school.code === updatedSchool.code ? updatedSchool : school
            )
        );
        // Also update the selected school if it's the one being edited
        if (selectedSchool && selectedSchool.code === updatedSchool.code) {
            setSelectedSchool(updatedSchool);
        }
    };
    
    const handleUpdateManagementStatus = (schoolId: number, status: SchoolManagementStatus) => {
        setManagementStatus(prev => ({...prev, [schoolId]: status}));
    };

    const handleAddNote = (schoolId: number, noteContent: string) => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            content: noteContent,
            timestamp: new Date(),
        };

        const updatedSchools = schools.map(school => {
            if (school.code === schoolId) {
                return {
                    ...school,
                    notes: [newNote, ...school.notes], // Add new note to the beginning
                };
            }
            return school;
        });

        setSchools(updatedSchools);

        if (selectedSchool && selectedSchool.code === schoolId) {
            setSelectedSchool(updatedSchools.find(s => s.code === schoolId) || null);
        }
    };
    
    const handleSetActiveTab = (tab: 'agenda') => {
        setActiveTab(tab);
    }

    const schoolAppointments = useMemo(() => {
        const map = new Map<number, Appointment[]>();
        appointments.forEach(app => {
            if (!map.has(app.schoolId)) {
                map.set(app.schoolId, []);
            }
            map.get(app.schoolId)!.push(app);
        });
        return map;
    }, [appointments]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando datos de los colegios...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-md w-full sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                         <div className="flex items-center space-x-3">
                            <BuildingIcon className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-gray-800">Agendador Escolar</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                {error && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md z-50" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <div className="max-w-7xl mx-auto h-full flex flex-col p-4 sm:p-6 lg:p-8 gap-4">
                     {/* Tab Navigation */}
                    <div className="flex-shrink-0">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('agenda')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'agenda' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Agenda
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendario')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calendario' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Calendario
                                </button>
                            </nav>
                        </div>
                    </div>

                     {/* Content Area */}
                    <div className="flex-1 min-h-0">
                        {activeTab === 'agenda' ? (
                            <div className="flex flex-row h-full gap-8">
                                <div className={`flex-shrink-0 w-full lg:w-1/3 ${selectedSchool ? 'hidden lg:block' : 'block'}`}>
                                    <SchoolList 
                                        schools={schools}
                                        onSelectSchool={handleSelectSchool}
                                        selectedSchool={selectedSchool}
                                        schoolStatusMap={schoolStatus}
                                        managementStatusMap={managementStatus}
                                    />
                                </div>
                                <div className={`flex-1 w-full lg:w-2/3 overflow-y-auto ${selectedSchool ? 'block' : 'hidden lg:block'}`}>
                                    <SchoolDetail
                                        school={selectedSchool}
                                        onGoBack={() => handleSelectSchool(null)}
                                        allAppointments={appointments}
                                        schoolAppointments={selectedSchool ? schoolAppointments.get(selectedSchool.code) || [] : []}
                                        onAddAppointment={addAppointment}
                                        onUpdateSchool={handleUpdateSchool}
                                        onAddNote={handleAddNote}
                                        schoolStatus={selectedSchool ? schoolStatus[selectedSchool.code] : undefined}
                                        courseStatusMap={courseStatus}
                                        onUpdateCourseStatus={updateCourseStatus}
                                        managementStatus={selectedSchool ? managementStatus[selectedSchool.code] : undefined}
                                        onUpdateManagementStatus={handleUpdateManagementStatus}
                                    />
                                </div>
                            </div>
                        ) : (
                            <CalendarView 
                                appointments={appointments} 
                                schools={schools} 
                                onSelectSchool={handleSelectSchool} 
                                setActiveTab={handleSetActiveTab} 
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;