import React, { useState } from 'react';
import type { School } from '../types';
import { SchoolContactStatus, SchoolManagementStatus } from '../types';
import { BuildingIcon, PhoneIcon, SendIcon, MailIcon, GraduationCapIcon, CheckCircleIcon, UserIcon } from '../constants';

interface SchoolListProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  selectedSchool: School | null;
  schoolStatusMap: Record<number, SchoolContactStatus>;
  managementStatusMap: Record<number, SchoolManagementStatus>;
}

export const SchoolList: React.FC<SchoolListProps> = ({ schools, onSelectSchool, selectedSchool, schoolStatusMap, managementStatusMap }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg h-full max-h-[85vh] flex flex-col">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Colegios ({filteredSchools.length})</h2>
        <input
          type="text"
          placeholder="Buscar por nombre de colegio..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="overflow-y-auto flex-grow p-4 space-y-4">
        {filteredSchools.length > 0 ? (
          filteredSchools.map(school => {
            const contactStatus = schoolStatusMap[school.code] || SchoolContactStatus.NotContacted;
            const managementStatus = managementStatusMap[school.code] || SchoolManagementStatus.Pending;
            const lastNote = school.notes.length > 0 ? school.notes[0] : null;
            const wazeUrl = `https://www.waze.com/ul?ll=${school.latitude}%2C${school.longitude}&navigate=yes`;
            
            return (
              <button
                key={school.code}
                onClick={() => onSelectSchool(school)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedSchool?.code === school.code ? 'bg-white border-indigo-500 shadow-lg' : 'bg-gray-50 border-transparent hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <BuildingIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{school.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                contactStatus === SchoolContactStatus.Contacted ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                            }`}>{contactStatus}</span>
                            <span className="flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                                <GraduationCapIcon className="w-3 h-3 mr-1.5"/>
                                {school.courses.length} {school.courses.length === 1 ? 'Curso' : 'Cursos'}
                            </span>
                            {managementStatus === SchoolManagementStatus.Completed && (
                                <span className="flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-3 h-3 mr-1.5"/>
                                    Gestión Terminada
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 my-3"></div>
                
                <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-start">
                        <UserIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{school.director}</span>
                    </p>
                    <p className="flex items-start">
                        <PhoneIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{school.phone}</span>
                    </p>
                    <p className="flex items-start">
                        <MailIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="break-all">{school.email.replace(';', ' ')}</span>
                    </p>
                     {lastNote && (
                        <p className="italic text-gray-500 pt-1 truncate">
                           Última nota: "{lastNote.content}"
                        </p>
                    )}
                </div>

                <div className="mt-4 flex space-x-2">
                    <a
                        href={`tel:${school.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center space-x-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                        <PhoneIcon className="w-4 h-4" />
                        <span>Llamar</span>
                    </a>
                    <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center space-x-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                        <SendIcon className="w-4 h-4" />
                        <span>Waze</span>
                    </a>
                </div>
              </button>
            )
        })
        ) : (
          <p className="p-4 text-center text-gray-500">No se encontraron colegios.</p>
        )}
      </div>
    </div>
  );
};