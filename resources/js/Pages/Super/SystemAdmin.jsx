import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
// route is available globally

export default function SystemAdmin({ 
    users, 
    systemStats, 
    activityLogs, 
    integrations, 
    systemTools, 
    auditLogs,
    interventions,
    departments,
    programs,
    sections,
    students = [],
    attendanceStats,
    todayAttendance,
    trends,
    recentRecords,
    calendarData,
    departmentTrends,
    facultyCompliance,
    teachers: teachersProp = [],
    activeTab: initialActiveTab = 'dashboard',
    pageTitle = 'System Admin Control'
}) {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showLogs, setShowLogs] = useState(false);
    const [systemLogs, setSystemLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [liveDepartmentTrends, setLiveDepartmentTrends] = useState(departmentTrends);
    const [liveFacultyCompliance, setLiveFacultyCompliance] = useState(facultyCompliance);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    
    // Auto-refresh dashboard data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const refreshDashboardData = async () => {
        try {
            const response = await fetch(route('super.dashboard.refresh'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLiveDepartmentTrends(data.departmentTrends);
                setLiveFacultyCompliance(data.facultyCompliance);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    };
    
    // Teachers management state
    const [activeSettingsTab, setActiveSettingsTab] = useState('teachers');
    const [teachers, setTeachers] = useState(teachersProp);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [teacherForm, setTeacherForm] = useState({
        name: '',
        email: '',
        password: '',
        department_id: null,
        program_id: null,
        section_ids: []
    });

    // Interventions management state
    const [interventionsData, setInterventionsData] = useState(interventions?.data || []);
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [editingIntervention, setEditingIntervention] = useState(null);
    const [viewingIntervention, setViewingIntervention] = useState(null);
    const [interventionForm, setInterventionForm] = useState({
        student_id: '',
        type: '',
        details: '',
        priority: 'low',
        responsible_staff: '',
        due_date: '',
        status: 'in_progress'
    });

    // Sections management state
    const [sectionsData, setSectionsData] = useState(sections || []);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionForm, setSectionForm] = useState({
        name: '',
        year_level: '',
        academic_year: new Date().getFullYear().toString(),
        semester: '1st Semester',
        adviser_name: '',
        department_id: '',
        program_id: '',
        max_students: 50
    });
    const [sectionFilters, setSectionFilters] = useState({
        department: '',
        program: '',
        year_level: '',
        academic_year: ''
    });

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Real-time trends data fetching - Temporarily disabled to prevent console errors
    useEffect(() => {
        // Temporarily disabled due to route configuration issues
        // const fetchTrendsData = async () => {
        //     try {
        //         const response = await fetch(route('super.reports.trends'));
        //         const data = await response.json();
        //         setLiveDepartmentTrends(data.departmentTrends);
        //         setLiveFacultyCompliance(data.facultyCompliance);
        //     } catch (error) {
        //         console.error('Error fetching trends data:', error);
        //     }
        // };

        // // Fetch immediately
        // fetchTrendsData();

        // // Set up interval to fetch every 30 seconds
        // const trendsTimer = setInterval(fetchTrendsData, 30000);

        // return () => clearInterval(trendsTimer);
    }, []);

    // Fetch teachers data when Settings tab is active
    useEffect(() => {
        if (activeTab === 'settings' && teachersProp.length === 0) {
            // If no teachers data is available, fetch it
            router.get(route('super.settings'), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [activeTab]);

    // Set Teachers sub-tab as active when coming from Teachers navigation
    useEffect(() => {
        if (activeTab === 'settings' && window.location.hash === '#teachers') {
            setActiveSettingsTab('teachers');
        }
    }, [activeTab]);

    // Auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Handle Weekly Summary Generation - Temporarily disabled
    const handleGenerateWeeklySummary = async () => {
        // Temporarily disabled due to route configuration issues
        setNotification({ type: 'info', message: 'Weekly Summary generation is temporarily disabled' });
        // setIsLoading(true);
        // try {
        //     const response = await fetch(route('super.reports.weekly.pdf'), {
        //         method: 'GET',
        //         headers: {
        //             'Accept': 'application/pdf',
        //         },
        //     });
        //     
        //     if (response.ok) {
        //         const blob = await response.blob();
        //         const url = window.URL.createObjectURL(blob);
        //         const a = document.createElement('a');
        //         a.href = url;
        //         a.download = `weekly-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        //         document.body.appendChild(a);
        //         a.click();
        //         window.URL.revokeObjectURL(url);
        //         document.body.removeChild(a);
        //         
        //         setNotification({ type: 'success', message: 'Weekly summary PDF generated successfully!' });
        //     } else {
        //         throw new Error('Failed to generate PDF');
        //     }
        // } catch (error) {
        //     console.error('Error generating weekly summary:', error);
        //     setNotification({ type: 'error', message: 'Failed to generate weekly summary. Please try again.' });
        // } finally {
        //     setIsLoading(false);
        // }
    };

    // Handle Student Records Export - Temporarily disabled
    const handleExportStudentRecords = async () => {
        // Temporarily disabled due to route configuration issues
        setNotification({ type: 'info', message: 'Student Records export is temporarily disabled' });
        // setIsLoading(true);
        // try {
        //     const response = await fetch(route('super.reports.student-records.excel'), {
        //         method: 'GET',
        //         headers: {
        //             'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        //         },
        //     });
        //     
        //     if (response.ok) {
        //         const blob = await response.blob();
        //         const url = window.URL.createObjectURL(blob);
        //         const a = document.createElement('a');
        //         a.href = url;
        //         a.download = `student-records-${new Date().toISOString().split('T')[0]}.xlsx`;
        //         document.body.appendChild(a);
        //         a.click();
        //         window.URL.revokeObjectURL(url);
        //         document.body.removeChild(a);
        //         
        //         setNotification({ type: 'success', message: 'Student records Excel file exported successfully!' });
        //     } else {
        //         throw new Error('Failed to export Excel');
        //     }
        // } catch (error) {
        //     console.error('Error exporting student records:', error);
        //     setNotification({ type: 'error', message: 'Failed to export student records. Please try again.' });
        // } finally {
        //     setIsLoading(false);
        // }
    };

    // Teachers management functions
    const handleCreateTeacher = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.teachers.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify(teacherForm),
            });

            if (response.ok) {
                const result = await response.json();
                setTeachers([...teachers, result.teacher]);
                setShowTeacherModal(false);
                setTeacherForm({ name: '', email: '', password: '', department_id: null, program_id: null, section_ids: [] });
                setNotification({ type: 'success', message: 'Teacher created successfully!' });
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create teacher');
            }
        } catch (error) {
            console.error('Error creating teacher:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to create teacher. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTeacher = async () => {
        if (!editingTeacher) return;
        
        setIsLoading(true);
        try {
            // Prepare data with proper null handling
            const updateData = {
                name: teacherForm.name,
                email: teacherForm.email,
                password: teacherForm.password || null,
                department_id: teacherForm.department_id || null,
                program_id: teacherForm.program_id || null,
                section_ids: teacherForm.section_ids || []
            };

            console.log('Updating teacher with data:', updateData);
            console.log('Teacher ID:', editingTeacher.id);
            
            const response = await fetch(route('super.teachers.update', editingTeacher.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.ok) {
                const result = await response.json();
                setTeachers(teachers.map(t => t.id === editingTeacher.id ? result.teacher : t));
                setShowTeacherModal(false);
                setEditingTeacher(null);
                setTeacherForm({ name: '', email: '', password: '', department_id: null, program_id: null, section_ids: [] });
                setNotification({ type: 'success', message: 'Teacher updated successfully!' });
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Failed to update teacher');
            }
        } catch (error) {
            console.error('Error updating teacher:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update teacher. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTeacher = async (teacherId) => {
        if (!confirm('Are you sure you want to delete this teacher?')) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(route('super.teachers.destroy', teacherId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                setTeachers(teachers.filter(t => t.id !== teacherId));
                setNotification({ type: 'success', message: 'Teacher deleted successfully!' });
            } else {
                throw new Error('Failed to delete teacher');
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            setNotification({ type: 'error', message: 'Failed to delete teacher. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const openTeacherModal = (teacher = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setTeacherForm({
                name: teacher.name,
                email: teacher.email,
                password: '',
                department_id: teacher.department_id || null,
                program_id: teacher.program_id || null,
                section_ids: teacher.sections?.map(s => s.id) || []
            });
        } else {
            setEditingTeacher(null);
            setTeacherForm({ name: '', email: '', password: '', department_id: null, program_id: null, section_ids: [] });
        }
        setShowTeacherModal(true);
    };

    // Intervention CRUD functions
    const handleCreateIntervention = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(interventionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setInterventionsData([...interventionsData, result.intervention]);
                setShowInterventionModal(false);
                setInterventionForm({
                    student_id: '',
                    type: '',
                    details: '',
                    priority: 'low',
                    responsible_staff: '',
                    due_date: '',
                    status: 'in_progress'
                });
                setNotification({ type: 'success', message: 'Intervention created successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create intervention');
            }
        } catch (error) {
            console.error('Error creating intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to create intervention. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIntervention = async () => {
        if (!editingIntervention) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.update', editingIntervention.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(interventionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setInterventionsData(interventionsData.map(i => i.id === editingIntervention.id ? result.intervention : i));
                setShowInterventionModal(false);
                setEditingIntervention(null);
                setInterventionForm({
                    student_id: '',
                    type: '',
                    details: '',
                    priority: 'low',
                    responsible_staff: '',
                    due_date: '',
                    status: 'in_progress'
                });
                setNotification({ type: 'success', message: 'Intervention updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update intervention');
            }
        } catch (error) {
            console.error('Error updating intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update intervention. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteIntervention = async (interventionId) => {
        if (!confirm('Are you sure you want to delete this intervention?')) return;
        
        setIsLoading(true);
        try {
            // Use Inertia router for better CSRF handling
            router.delete(route('super.interventions.destroy', interventionId), {
                onSuccess: (page) => {
                    // Remove the intervention from local state
                    setInterventionsData(interventionsData.filter(i => i.id !== interventionId));
                    // Show success message from session
                    if (page.props.flash?.success) {
                        setNotification({ type: 'success', message: page.props.flash.success });
                    }
                },
                onError: (errors) => {
                    console.error('Error deleting intervention:', errors);
                    setNotification({ type: 'error', message: 'Failed to delete intervention. Please try again.' });
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Error deleting intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete intervention. Please try again.' });
            setIsLoading(false);
        }
    };

    const handleUpdateInterventionStatus = async (interventionId, newStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.update', interventionId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    // Include other required fields to avoid validation errors
                    student_id: viewingIntervention.student_id,
                    type: viewingIntervention.type,
                    details: viewingIntervention.details,
                    priority: viewingIntervention.priority,
                    responsible_staff: viewingIntervention.responsible_staff,
                    due_date: viewingIntervention.due_date
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Update the intervention in the local state
                setInterventionsData(interventionsData.map(i => i.id === interventionId ? result.intervention : i));
                // Update the viewing intervention with the new data
                setViewingIntervention(result.intervention);
                setNotification({ type: 'success', message: 'Intervention status updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update intervention status');
            }
        } catch (error) {
            console.error('Error updating intervention status:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update intervention status. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const openInterventionModal = (intervention = null, viewMode = false) => {
        console.log('Opening intervention modal:', { intervention, viewMode });
        if (intervention) {
            if (viewMode) {
                console.log('Setting viewing intervention:', intervention);
                setViewingIntervention(intervention);
                setEditingIntervention(null);
            } else {
                setEditingIntervention(intervention);
                setViewingIntervention(null);
                setInterventionForm({
                    student_id: intervention.student_id || '',
                    type: intervention.type || '',
                    details: intervention.details || '',
                    priority: intervention.priority || 'low',
                    responsible_staff: intervention.responsible_staff || '',
                    due_date: intervention.due_date || '',
                    status: intervention.status || 'in_progress'
                });
            }
        } else {
            setEditingIntervention(null);
            setViewingIntervention(null);
            setInterventionForm({
                student_id: '',
                type: '',
                details: '',
                priority: 'low',
                responsible_staff: '',
                due_date: '',
                status: 'in_progress'
            });
        }
        console.log('Setting showInterventionModal to true');
        setShowInterventionModal(true);
    };

    // Section Management Functions
    const handleCreateSection = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.sections.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sectionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setSectionsData([result.section, ...sectionsData]);
                setShowSectionModal(false);
                setSectionForm({
                    name: '',
                    year_level: '',
                    academic_year: new Date().getFullYear().toString(),
                    semester: '1st Semester',
                    adviser_name: '',
                    department_id: '',
                    program_id: '',
                    max_students: 50
                });
                setNotification({ type: 'success', message: 'Section created successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create section');
            }
        } catch (error) {
            console.error('Error creating section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to create section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSection = async () => {
        if (!editingSection) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(route('super.sections.update', editingSection.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sectionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setSectionsData(sectionsData.map(s => s.id === editingSection.id ? result.section : s));
                setShowSectionModal(false);
                setEditingSection(null);
                setSectionForm({
                    name: '',
                    year_level: '',
                    academic_year: new Date().getFullYear().toString(),
                    semester: '1st Semester',
                    adviser_name: '',
                    department_id: '',
                    program_id: '',
                    max_students: 50
                });
                setNotification({ type: 'success', message: 'Section updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update section');
            }
        } catch (error) {
            console.error('Error updating section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(route('super.sections.destroy', sectionId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                setSectionsData(sectionsData.filter(s => s.id !== sectionId));
                setNotification({ type: 'success', message: 'Section deleted successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete section');
            }
        } catch (error) {
            console.error('Error deleting section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const openSectionModal = (section = null) => {
        if (section) {
            setEditingSection(section);
            setSectionForm({
                name: section.name || '',
                year_level: section.year_level || '',
                academic_year: section.academic_year || new Date().getFullYear().toString(),
                semester: section.semester || '1st Semester',
                adviser_name: section.adviser_name || '',
                department_id: section.program?.department_id || section.department_id || '',
                program_id: section.program_id || '',
                max_students: section.max_students || 50
            });
        } else {
            setEditingSection(null);
            setSectionForm({
                name: '',
                year_level: '',
                academic_year: new Date().getFullYear().toString(),
                semester: '1st Semester',
                adviser_name: '',
                department_id: '',
                program_id: '',
                max_students: 50
            });
        }
        setShowSectionModal(true);
    };

    // Filter sections based on current filters
    const filteredSections = sectionsData.filter(section => {
        const matchesDepartment = !sectionFilters.department || 
            section.program?.department?.name?.toLowerCase().includes(sectionFilters.department.toLowerCase()) ||
            section.department?.toLowerCase().includes(sectionFilters.department.toLowerCase());
        
        const matchesProgram = !sectionFilters.program || 
            section.program?.name?.toLowerCase().includes(sectionFilters.program.toLowerCase()) ||
            section.program?.toLowerCase().includes(sectionFilters.program.toLowerCase());
        
        const matchesYearLevel = !sectionFilters.year_level || 
            section.year_level?.toString().includes(sectionFilters.year_level);
        
        const matchesAcademicYear = !sectionFilters.academic_year || 
            section.academic_year?.toString().includes(sectionFilters.academic_year);

        return matchesDepartment && matchesProgram && matchesYearLevel && matchesAcademicYear;
    });

    const handleToolAction = async (toolName, action) => {
        console.log('Tool action triggered:', action, toolName);
        setIsLoading(true);
        setSelectedTool(toolName);
        
        try {
            let response;
            let data;
            
            switch (action) {
                case 'clear-cache':
                    response = await fetch(route('super.system-admin.clear-cache'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'optimize':
                    response = await fetch(route('super.system-admin.optimize'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'backup':
                    response = await fetch(route('super.system-admin.backup'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: `${data.message} - File: ${data.filename} (${data.size})` });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'maintenance':
                    response = await fetch(route('super.system-admin.maintenance'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'view-logs':
                    response = await fetch(route('super.system-admin.logs'), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.logs) {
                        setSystemLogs(data.logs);
                        setShowLogs(true);
                        setNotification({ type: 'success', message: 'System logs loaded successfully' });
                    } else {
                        setNotification({ type: 'error', message: 'Failed to load system logs' });
                    }
                    break;
                    
                default:
                    setNotification({ type: 'error', message: `Unknown action: ${action}` });
            }
        } catch (error) {
            console.error('Tool action error:', error);
            setNotification({ type: 'error', message: `Failed to ${action} ${toolName}: ${error.message}` });
        } finally {
            setIsLoading(false);
            setSelectedTool(null);
        }
    };

    // Render functions for each tab
    const renderInterventions = () => {
        return (
            <div className="space-y-6">
                    {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                        </div>
                        </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Interventions</p>
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.total || 0}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                        </div>
                        </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Done</p>
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.done || 0}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                            </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">In Progress</p>
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.in_progress || 0}</p>
                            </div>
                            </div>
                        </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">No Response</p>
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.no_response || 0}</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Interventions Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Interventions</h3>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => openInterventionModal()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Add New Intervention
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Test button clicked - opening modal with test data');
                                    openInterventionModal({
                                        id: 1,
                                        type: 'Test Intervention',
                                        details: 'This is a test intervention',
                                        status: 'in_progress',
                                        priority: 'medium',
                                        student: { first_name: 'Test', last_name: 'Student', student_number: 'TEST001' }
                                    }, true);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            >
                                Test Modal
                            </button>
                        </div>
                    </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'student',
                                    label: 'Student',
                                    render: (_, record) => (
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {record.student?.first_name} {record.student?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{record.student?.student_number}</div>
                                            <div className="text-xs text-gray-400">
                                                {record.student?.section?.program?.department?.name || 'No Department'}
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'section',
                                    label: 'Section',
                                    render: (_, record) => (
                                        <div>
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                                            {record.student?.section?.name || 'N/A'}
                                        </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {record.student?.section?.program?.name || 'No Program'}
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'type',
                                    label: 'Type',
                                    render: (type) => (
                                        <span className="font-medium text-gray-900">{type}</span>
                                    )
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (status) => {
                                        const statusColors = {
                                            'done': 'bg-green-100 text-green-800',
                                            'in_progress': 'bg-yellow-100 text-yellow-800',
                                            'no_response': 'bg-red-100 text-red-800',
                                            'open': 'bg-blue-100 text-blue-800',
                                            'resolved': 'bg-green-100 text-green-800',
                                            'pending': 'bg-yellow-100 text-yellow-800',
                                            'escalated': 'bg-red-100 text-red-800'
                                        };
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                                {status}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'priority',
                                    label: 'Priority',
                                    render: (priority) => {
                                        const priorityColors = {
                                            'low': 'bg-gray-100 text-gray-800',
                                            'medium': 'bg-yellow-100 text-yellow-800',
                                            'high': 'bg-orange-100 text-orange-800',
                                            'urgent': 'bg-red-100 text-red-800'
                                        };
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
                                                {priority}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'date',
                                    label: 'Date',
                                    render: (date) => new Date(date).toLocaleDateString()
                                },
                                {
                                    key: 'responsible_staff',
                                    label: 'Responsible Staff',
                                    render: (_, record) => {
                                        if (record.responsible_staff) {
                                            return (
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {record.responsible_staff.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {record.responsible_staff.email}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <span className="text-gray-500 italic">Not Assigned</span>
                                        );
                                    }
                                },
                                {
                                    key: 'recorded_by',
                                    label: 'Recorded By',
                                    render: (_, record) => record.recorded_by?.name || 'System'
                                }
                            ]}
                            data={interventionsData}
                            actions={true}
                            onView={(record) => openInterventionModal(record, true)}
                            onDelete={(record) => handleDeleteIntervention(record.id)}
                        />
                </div>
            </div>
        );
    };

    const renderAttendance = () => (
        <div className="space-y-6">
            {/* Attendance Header */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Attendance Management</h2>
                </div>

                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Present Today</h3>
                        <p className="text-3xl font-bold text-green-900">{attendanceStats?.present_count || 0}</p>
                        <p className="text-xs text-green-700 mt-1">{attendanceStats?.present_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-6 border-l-4 border-red-500">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Absent Today</h3>
                        <p className="text-3xl font-bold text-red-900">{attendanceStats?.absent_count || 0}</p>
                        <p className="text-xs text-red-700 mt-1">{attendanceStats?.absent_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-6 border-l-4 border-yellow-500">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">Late Today</h3>
                        <p className="text-3xl font-bold text-yellow-900">{attendanceStats?.late_count || 0}</p>
                        <p className="text-xs text-yellow-700 mt-1">{attendanceStats?.late_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Records</h3>
                        <p className="text-3xl font-bold text-blue-900">{attendanceStats?.total_count || 0}</p>
                        <p className="text-xs text-blue-700 mt-1">Today's records</p>
                    </div>
                </div>

                {/* Real-time Attendance Trends */}
                <div className="bg-white rounded-3xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">📈 Real-time Attendance Trends</h3>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live Data</span>
                    </div>
                </div>

                    {/* Department Attendance Trends */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Weekly Attendance Rates</h4>
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <div className="relative h-80">
                                {/* Simple Line Chart for Department Trends */}
                                <div className="flex items-end justify-between h-full">
                                    {liveDepartmentTrends?.slice(0, 7).map((day, dayIndex) => {
                                        const maxRate = Math.max(...(day.departments?.map(d => d.attendance_rate) || [0]));
                                        return (
                                            <div key={dayIndex} className="flex flex-col items-center flex-1">
                                                <div className="text-xs text-gray-600 mb-2">{day.day}</div>
                                                <div className="space-y-1 w-full">
                                                    {day.departments?.map((dept, deptIndex) => {
                                                        const height = maxRate > 0 ? (dept.attendance_rate / maxRate) * 200 : 0;
                                                        const colors = [
                                                            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                                                            'bg-orange-500', 'bg-red-500', 'bg-yellow-500',
                                                            'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
                                                            'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
                                                        ];
                                                        const colorClass = colors[deptIndex % colors.length];
                                                        return (
                                                            <div key={deptIndex} className="relative">
                                                                <div 
                                                                    className={`${colorClass} rounded-t w-3 transition-all duration-500 ease-out`}
                                                                    style={{ height: `${height}px` }}
                                                                    title={`${dept.department}: ${dept.attendance_rate}%`}
                                                                ></div>
                                    </div>
                                                        );
                                                    })}
                                </div>
                            </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {liveDepartmentTrends?.[0]?.departments?.map((dept, index) => {
                                    const colors = [
                                        'text-blue-600', 'text-green-600', 'text-purple-600',
                                        'text-orange-600', 'text-red-600', 'text-yellow-600',
                                        'text-indigo-600', 'text-pink-600', 'text-teal-600',
                                        'text-cyan-600', 'text-lime-600', 'text-amber-600'
                                    ];
                                    const colorClass = colors[index % colors.length];
                                    return (
                                        <div key={index} className="text-center p-3 bg-white rounded-lg border">
                                            <div className={`text-lg font-bold ${colorClass}`}>{dept.attendance_rate}%</div>
                                            <div className="text-sm text-gray-600">{dept.department}</div>
                                            <div className="text-xs text-gray-500">{dept.total_records} records</div>
                            </div>
                                    );
                                })}
                                    </div>
                                </div>
                            </div>

                    {/* Faculty Compliance Trends */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Faculty Compliance Rates</h4>
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <div className="relative h-80">
                                {/* Simple Line Chart for Faculty Compliance */}
                                <div className="flex items-end justify-between h-full">
                                    {liveFacultyCompliance?.slice(0, 7).map((day, dayIndex) => {
                                        const maxRate = Math.max(...(day.teachers?.map(t => t.compliance_rate) || [0]));
                                        return (
                                            <div key={dayIndex} className="flex flex-col items-center flex-1">
                                                <div className="text-xs text-gray-600 mb-2">{day.day}</div>
                                                <div className="space-y-1 w-full">
                                                    {day.teachers?.map((teacher, teacherIndex) => {
                                                        const height = maxRate > 0 ? (teacher.compliance_rate / maxRate) * 200 : 0;
                                                        const colors = [
                                                            'bg-orange-500', 'bg-red-500', 'bg-yellow-500',
                                                            'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                                                            'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
                                                            'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
                                                        ];
                                                        const colorClass = colors[teacherIndex % colors.length];
                                                        return (
                                                            <div key={teacherIndex} className="relative">
                                                                <div 
                                                                    className={`${colorClass} rounded-t w-3 transition-all duration-500 ease-out`}
                                                                    style={{ height: `${height}px` }}
                                                                    title={`${teacher.teacher}: ${teacher.compliance_rate}%`}
                                                                ></div>
                        </div>
                                                        );
                                                    })}
                    </div>
                            </div>
                                        );
                                    })}
                            </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {liveFacultyCompliance?.[0]?.teachers?.map((teacher, index) => {
                                    const colors = [
                                        'text-orange-600', 'text-red-600', 'text-yellow-600',
                                        'text-blue-600', 'text-green-600', 'text-purple-600',
                                        'text-indigo-600', 'text-pink-600', 'text-teal-600',
                                        'text-cyan-600', 'text-lime-600', 'text-amber-600'
                                    ];
                                    const colorClass = colors[index % colors.length];
                                    return (
                                        <div key={index} className="text-center p-3 bg-white rounded-lg border">
                                            <div className={`text-lg font-bold ${colorClass}`}>{teacher.compliance_rate}%</div>
                                            <div className="text-sm text-gray-600">{teacher.teacher}</div>
                                            <div className="text-xs text-gray-500">{teacher.scheduled_classes} classes</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Reports & Analytics</h2>
                <p className="text-gray-600 mb-6">Generate comprehensive system reports and analytics.</p>
                
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">Weekly Summary</h3>
                        <p className="text-sm text-gray-600 mb-4">Generate comprehensive weekly attendance summary with department breakdowns and trends</p>
                        <button 
                            onClick={() => handleGenerateWeeklySummary()}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Generate PDF
                        </button>
                    </div>
                    <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">Student Records</h3>
                        <p className="text-sm text-gray-600 mb-4">Export comprehensive student attendance records and intervention data</p>
                        <button 
                            onClick={() => handleExportStudentRecords()}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    const renderSections = () => (
        <div className="space-y-6">
            {/* Sections Header */}
            <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Sections Management</h2>
                    <p className="mt-2 text-gray-600">Manage all sections across departments and programs</p>
                        </div>

                {/* Sections Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Sections</h3>
                        <p className="text-3xl font-bold text-blue-900">{sections?.length || 0}</p>
                        </div>
                    <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Active Sections</h3>
                        <p className="text-3xl font-bold text-green-900">{sections?.filter(s => s.academic_year === new Date().getFullYear().toString()).length || 0}</p>
                        </div>
                    <div className="bg-purple-50 rounded-2xl p-6 border-l-4 border-purple-500">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">Departments</h3>
                        <p className="text-3xl font-bold text-purple-900">{departments?.length || 0}</p>
                        </div>
                    <div className="bg-orange-50 rounded-2xl p-6 border-l-4 border-orange-500">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">Programs</h3>
                        <p className="text-3xl font-bold text-orange-900">{programs?.length || 0}</p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Sections</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input
                                type="text"
                                placeholder="Filter by department..."
                                value={sectionFilters.department}
                                onChange={(e) => setSectionFilters({...sectionFilters, department: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                            <input
                                type="text"
                                placeholder="Filter by program..."
                                value={sectionFilters.program}
                                onChange={(e) => setSectionFilters({...sectionFilters, program: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                            <input
                                type="text"
                                placeholder="Filter by year level..."
                                value={sectionFilters.year_level}
                                onChange={(e) => setSectionFilters({...sectionFilters, year_level: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <input
                                type="text"
                                placeholder="Filter by academic year..."
                                value={sectionFilters.academic_year}
                                onChange={(e) => setSectionFilters({...sectionFilters, academic_year: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                        <button 
                            onClick={() => setSectionFilters({department: '', program: '', year_level: '', academic_year: ''})}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Clear Filters
                        </button>
                        <span className="text-sm text-gray-500">
                            Showing {filteredSections.length} of {sectionsData.length} sections
                        </span>
                    </div>
                </div>

                {/* Sections Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Sections</h3>
                            <button 
                            onClick={() => openSectionModal()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                            Add New Section
                            </button>
                        </div>
                    
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={[
                                {
                                    key: 'section_code',
                                    label: 'Section Code',
                                    render: (_, record) => {
                                        const programCode = record.program?.code || record.program?.name || record.program || 'No Program';
                                        return (
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {programCode}-{record.year_level}{record.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{record.academic_year} • {record.semester}</div>
                                            </div>
                                        );
                                    }
                                },
                                {
                                    key: 'department',
                                    label: 'Department',
                                    render: (_, record) => {
                                        const departmentName = record.program?.department?.name || record.department || 'No Department';
                                        return (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                                                {departmentName}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'program',
                                    label: 'Program',
                                    render: (program, record) => {
                                        const programName = program?.name || program || record.program || 'No Program';
                                        return programName;
                                    }
                                },
                                {
                                    key: 'year_level',
                                    label: 'Year Level',
                                    render: (year_level) => (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                                            {year_level}
                                        </span>
                                    )
                                },
                                {
                                    key: 'adviser_name',
                                    label: 'Adviser',
                                    render: (adviser_name) => {
                                        const cleanName = adviser_name?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || 'No Adviser';
                                        return cleanName;
                                    }
                                },
                                {
                                    key: 'students_count',
                                    label: 'Students',
                                    render: (count) => (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                                            {count || 0} students
                                        </span>
                                    )
                                }
                            ]}
                            data={filteredSections}
                            actions={true}
                            onEdit={(record) => openSectionModal(record)}
                            onDelete={(record) => handleDeleteSection(record.id)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6">
            {/* Settings Navigation */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex space-x-4">
                    {/* Temporarily disabled - System Tools */}
                    {/* <button 
                        onClick={() => setActiveSettingsTab('tools')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeSettingsTab === 'tools'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        System Tools
                    </button> */}
                            <button 
                        onClick={() => setActiveSettingsTab('teachers')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeSettingsTab === 'teachers'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Teachers Management
                            </button>
                    {/* Temporarily disabled - Sections Management */}
                    {/* <button
                        onClick={() => setActiveSettingsTab('sections')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeSettingsTab === 'sections'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Sections Management
                    </button> */}
                        </div>
                </div>

            {/* System Tools Tab */}
            {activeSettingsTab === 'tools' && (
                <div className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">System Administration Tools</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Cache Management */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Cache Management</h3>
                                    <p className="text-sm text-gray-600">Clear application cache</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('cache', 'clear-cache')}
                                disabled={isLoading && selectedTool === 'cache'}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'cache' ? 'Clearing...' : 'Clear Cache'}
                            </button>
                        </div>

                        {/* System Optimization */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Optimization</h3>
                                    <p className="text-sm text-gray-600">Optimize system performance</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('optimization', 'optimize')}
                                disabled={isLoading && selectedTool === 'optimization'}
                                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'optimization' ? 'Optimizing...' : 'Optimize System'}
                            </button>
                        </div>

                        {/* Database Backup */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                    </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Database Backup</h3>
                                    <p className="text-sm text-gray-600">Create system backup</p>
                </div>
            </div>
                            <button 
                                onClick={() => handleToolAction('backup', 'backup')}
                                disabled={isLoading && selectedTool === 'backup'}
                                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'backup' ? 'Creating...' : 'Create Backup'}
                            </button>
        </div>

                        {/* Maintenance Mode */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
            </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
                                    <p className="text-sm text-gray-600">Enable maintenance mode</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('maintenance', 'maintenance')}
                                disabled={isLoading && selectedTool === 'maintenance'}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'maintenance' ? 'Processing...' : 'Enable Maintenance'}
                            </button>
                        </div>

                        {/* System Logs */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                    </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                                    <p className="text-sm text-gray-600">View system logs</p>
                </div>
            </div>
                            <button 
                                onClick={() => handleToolAction('logs', 'view-logs')}
                                disabled={isLoading && selectedTool === 'logs'}
                                className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'logs' ? 'Loading...' : 'View Logs'}
                            </button>
        </div>

                        {/* System Status */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
            </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                                    <p className="text-sm text-gray-600">Check system health</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setNotification({ type: 'info', message: 'System status: All systems operational' })}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Check Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teachers Management Tab */}
            {activeSettingsTab === 'teachers' && (
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
                        <button
                            onClick={() => openTeacherModal()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Add New Teacher
                        </button>
                    </div>

                    {/* Teachers Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {teacher.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {teacher.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {teacher.department?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {teacher.program?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {teacher.sections && teacher.sections.length > 0 ? (
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-600">
                                                        {teacher.sections.length} section{teacher.sections.length !== 1 ? 's' : ''} assigned
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.sections.slice(0, 3).map((section) => (
                                                            <span key={section.id} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                                {section.name}
                                                            </span>
                                                        ))}
                                                        {teacher.sections.length > 3 && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                                +{teacher.sections.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => openTeacherModal(teacher)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeacher(teacher.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Temporarily disabled - Sections Management Tab */}
            {/* {activeSettingsTab === 'sections' && (
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Sections Management</h2>
                        <button
                            onClick={() => router.get(route('super.sections'))}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Manage Sections
                        </button>
                    </div>
                    
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sections Management</h3>
                        <p className="text-gray-600 mb-6">Access the comprehensive sections management interface to create, edit, and manage all university sections.</p>
                        <button
                            onClick={() => router.get(route('super.sections'))}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Open Sections Management
                        </button>
                    </div>
                </div>
            )} */}

            {/* System Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
                                <button
                                    onClick={() => setShowLogs(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
            </div>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                                {systemLogs.length > 0 ? (
                                    systemLogs.map((log, index) => (
                                        <div key={index} className="mb-1">
                                            <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No logs available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Modal */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                                </h3>
                                <button
                                    onClick={() => setShowTeacherModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={teacherForm.name}
                                        onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={teacherForm.email}
                                        onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={teacherForm.password}
                                        onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!editingTeacher}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        value={teacherForm.department_id || ''}
                                        onChange={(e) => setTeacherForm({...teacherForm, department_id: e.target.value ? parseInt(e.target.value) : null, program_id: null, section_ids: []})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Department</option>
                                        {departments?.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                    <select
                                        value={teacherForm.program_id || ''}
                                        onChange={(e) => setTeacherForm({...teacherForm, program_id: e.target.value ? parseInt(e.target.value) : null, section_ids: []})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!teacherForm.department_id}
                                    >
                                        <option value="">Select Program</option>
                                        {programs?.filter(prog => prog.department_id == teacherForm.department_id).map((prog) => (
                                            <option key={prog.id} value={prog.id}>{prog.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sections</label>
                                    <select
                                        multiple
                                        value={teacherForm.section_ids}
                                        onChange={(e) => {
                                            const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                            setTeacherForm({...teacherForm, section_ids: values});
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!teacherForm.department_id}
                                    >
                                        <option value="" disabled>
                                            {teacherForm.section_ids.length === 0 ? 'No sections assigned' : `${teacherForm.section_ids.length} section(s) selected`}
                                        </option>
                                        {sections?.filter(section => {
                                            // Filter by program_id if program is selected
                                            if (teacherForm.program_id) {
                                                return section.program_id == teacherForm.program_id;
                                            }
                                            // If no program selected but department is selected, show all sections from that department
                                            if (teacherForm.department_id && section.program?.department_id) {
                                                return section.program.department_id == teacherForm.department_id;
                                            }
                                            // If no filters, show all sections
                                            return true;
                                        }).map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name} - {section.year_level} Year {section.program ? `(${section.program.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-2 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple sections</p>
                                        {teacherForm.section_ids.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setTeacherForm({...teacherForm, section_ids: []})}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTeacherModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={editingTeacher ? handleUpdateTeacher : handleCreateTeacher}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                    >
                                        {isLoading ? 'Saving...' : (editingTeacher ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Intervention Modal */}
            {console.log('Modal state:', { 
                showInterventionModal, 
                viewingIntervention: viewingIntervention ? 'has data' : 'null', 
                editingIntervention: editingIntervention ? 'has data' : 'null' 
            })}
            {showInterventionModal && (
                console.log('Rendering modal with data:', { viewingIntervention, editingIntervention })
            )}
            {showInterventionModal && (
                <div className="fixed inset-0 bg-red-500 bg-opacity-90 overflow-y-auto h-full w-full z-[9999]" style={{zIndex: 9999}}>
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" style={{backgroundColor: 'white', border: '2px solid red'}}>
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {viewingIntervention ? 'View Intervention' : editingIntervention ? 'Edit Intervention' : 'Add New Intervention'}
                                </h3>
                                <button
                                    onClick={() => {
                                        console.log('Closing intervention modal');
                                        setShowInterventionModal(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Test Content */}
                            <div className="p-4 bg-yellow-100 border-2 border-yellow-500">
                                <h4 className="text-lg font-bold text-red-600">MODAL IS WORKING!</h4>
                                <p>If you can see this, the modal is rendering correctly.</p>
                                <p>showInterventionModal: {showInterventionModal ? 'true' : 'false'}</p>
                                <p>viewingIntervention: {viewingIntervention ? 'has data' : 'null'}</p>
                                <p>editingIntervention: {editingIntervention ? 'has data' : 'null'}</p>
                            </div>
                            
                            {viewingIntervention ? (
                                // View Mode with Status Update
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Student</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {viewingIntervention.student?.first_name} {viewingIntervention.student?.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Student Number</label>
                                            <p className="mt-1 text-sm text-gray-900">{viewingIntervention.student?.student_number}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <p className="mt-1 text-sm text-gray-900">{viewingIntervention.type}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                viewingIntervention.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                viewingIntervention.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {viewingIntervention.priority}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Current Status</label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                viewingIntervention.status === 'done' ? 'bg-green-100 text-green-800' :
                                                viewingIntervention.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {viewingIntervention.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingIntervention.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Details</label>
                                        <p className="mt-1 text-sm text-gray-900">{viewingIntervention.details}</p>
                                    </div>
                                    {viewingIntervention.due_date && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingIntervention.due_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    
                                    {/* Status Update Section */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Update Status</h4>
                                        <div className="flex items-center space-x-4">
                                            <select
                                                value={viewingIntervention.status}
                                                onChange={(e) => {
                                                    const updatedIntervention = { ...viewingIntervention, status: e.target.value };
                                                    setViewingIntervention(updatedIntervention);
                                                }}
                                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                                <option value="no_response">No Response</option>
                                            </select>
                                            <button
                                                onClick={() => handleUpdateInterventionStatus(viewingIntervention.id, viewingIntervention.status)}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                            >
                                                {isLoading ? 'Updating...' : 'Update Status'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Edit/Create Mode
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Student</label>
                                        <select
                                            value={interventionForm.student_id}
                                            onChange={(e) => setInterventionForm({...interventionForm, student_id: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Student</option>
                                            {students?.map(student => (
                                                <option key={student.id} value={student.id}>
                                                    {student.first_name} {student.last_name} ({student.student_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <input
                                            type="text"
                                            value={interventionForm.type}
                                            onChange={(e) => setInterventionForm({...interventionForm, type: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Details</label>
                                        <textarea
                                            value={interventionForm.details}
                                            onChange={(e) => setInterventionForm({...interventionForm, details: e.target.value})}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                                            <select
                                                value={interventionForm.priority}
                                                onChange={(e) => setInterventionForm({...interventionForm, priority: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                value={interventionForm.status}
                                                onChange={(e) => setInterventionForm({...interventionForm, status: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                                <option value="no_response">No Response</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                        <input
                                            type="date"
                                            value={interventionForm.due_date}
                                            onChange={(e) => setInterventionForm({...interventionForm, due_date: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowInterventionModal(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={editingIntervention ? handleUpdateIntervention : handleCreateIntervention}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                        >
                                            {isLoading ? 'Saving...' : (editingIntervention ? 'Update' : 'Create')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Section Modal */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingSection ? 'Edit Section' : 'Add New Section'}
                                </h3>
                                <button
                                    onClick={() => setShowSectionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                        <input
                                            type="text"
                                            value={sectionForm.name}
                                            onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., A, B, C"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                        <select
                                            value={sectionForm.year_level}
                                            onChange={(e) => setSectionForm({...sectionForm, year_level: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <select
                                            value={sectionForm.department_id}
                                            onChange={(e) => {
                                                setSectionForm({...sectionForm, department_id: e.target.value, program_id: ''});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                        <select
                                            value={sectionForm.program_id}
                                            onChange={(e) => setSectionForm({...sectionForm, program_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={!sectionForm.department_id}
                                        >
                                            <option value="">Select Program</option>
                                            {programs?.filter(program => program.department_id == sectionForm.department_id).map(program => (
                                                <option key={program.id} value={program.id}>{program.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                        <input
                                            type="text"
                                            value={sectionForm.academic_year}
                                            onChange={(e) => setSectionForm({...sectionForm, academic_year: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                        <select
                                            value={sectionForm.semester}
                                            onChange={(e) => setSectionForm({...sectionForm, semester: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="1st Semester">1st Semester</option>
                                            <option value="2nd Semester">2nd Semester</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adviser Name</label>
                                        <input
                                            type="text"
                                            value={sectionForm.adviser_name}
                                            onChange={(e) => setSectionForm({...sectionForm, adviser_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter adviser name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                                        <input
                                            type="number"
                                            value={sectionForm.max_students}
                                            onChange={(e) => setSectionForm({...sectionForm, max_students: parseInt(e.target.value) || 50})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowSectionModal(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingSection ? handleUpdateSection : handleCreateSection}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : (editingSection ? 'Update Section' : 'Create Section')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDashboard = () => {
        return (
            <div className="space-y-8">
                {/* Main Dashboard Title */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-2">System overview and key metrics</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                    <button
                        onClick={refreshDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
                
                {/* Dashboard Overview - Main Summary Panel */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Dashboard Overview</h3>
                        <p className="text-sm text-gray-600">Main summary panel with key system metrics</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* Total Students Monitored */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-600">Total Students</p>
                                    <p className="text-2xl font-bold text-blue-900">{systemStats?.total_students || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Faculty Members */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-600">Faculty Members</p>
                                    <p className="text-2xl font-bold text-green-900">{systemStats?.totalTeachers || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Average Attendance Rate */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-purple-600">Avg Attendance</p>
                                    <p className="text-2xl font-bold text-purple-900">{systemStats?.average_attendance_rate || 0}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Departments with Low Attendance */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-orange-600">Departments</p>
                                    <p className="text-2xl font-bold text-orange-900">{systemStats?.totalDepartments || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Active Interventions */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-red-600">Active Interventions</p>
                                    <p className="text-2xl font-bold text-red-900">{systemStats?.activeInterventions || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Today's Attendance */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-indigo-600">Today's Attendance</p>
                                    <p className="text-2xl font-bold text-indigo-900">{systemStats?.todayAttendance || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Programs */}
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-teal-600">Total Programs</p>
                                    <p className="text-2xl font-bold text-teal-900">{systemStats?.totalPrograms || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Analytics Graphs */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Attendance Analytics</h3>
                        <p className="text-sm text-gray-600">Visual tools for attendance trends and analysis</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line Chart: Weekly Attendance Trends */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Attendance Trends</h4>
                            <div className="relative h-64">
                                {/* Simple Line Chart using CSS */}
                                <div className="flex items-end justify-between h-full">
                                    {liveDepartmentTrends && liveDepartmentTrends.length > 0 ? (
                                        liveDepartmentTrends.slice(0, 7).map((dayData, index) => {
                                            // Calculate average attendance rate for all departments on this day
                                            const avgRate = dayData.departments && dayData.departments.length > 0 
                                                ? dayData.departments.reduce((sum, dept) => sum + (dept.attendance_rate || 0), 0) / dayData.departments.length
                                                : 0;
                                            const height = Math.max((avgRate / 100) * 200, 10); // Minimum height for visibility
                                            return (
                                                <div key={index} className="flex flex-col items-center flex-1">
                                                    <div className="relative">
                                                        <div 
                                                            className="bg-blue-500 rounded-t w-6 transition-all duration-500 ease-out"
                                                            style={{ height: `${height}px` }}
                                                        ></div>
                                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                                                            {avgRate.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-600">
                                                        {dayData.day || `Day ${index + 1}`}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        // Fallback when no data is available
                                        Array.from({ length: 7 }, (_, index) => {
                                            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                            const mockRate = 75 + (Math.random() * 20); // Random rate between 75-95%
                                            const height = (mockRate / 100) * 200;
                                            return (
                                                <div key={index} className="flex flex-col items-center flex-1">
                                                    <div className="relative">
                                                        <div 
                                                            className="bg-gray-400 rounded-t w-6 transition-all duration-500 ease-out"
                                                            style={{ height: `${height}px` }}
                                                        ></div>
                                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                                                            {mockRate.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-600">
                                                        {days[index]}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
                                <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-sm text-gray-500">
                                    {liveDepartmentTrends && liveDepartmentTrends.length > 0 
                                        ? "Last 7 Days Average Attendance" 
                                        : "No attendance data available - showing sample data"
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Department Performance Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Department Performance</h4>
                            <div className="space-y-4">
                                {departments && departments.length > 0 ? (
                                    departments.map((dept, index) => {
                                        // Calculate average attendance rate for this department from live data
                                        let avgRate = 0;
                                        let totalRecords = 0;
                                        let presentRecords = 0;
                                        
                                        if (liveDepartmentTrends && liveDepartmentTrends.length > 0) {
                                            const deptData = liveDepartmentTrends.flatMap(day => 
                                                day.departments?.filter(d => d.department === dept.name) || []
                                            );
                                            
                                            if (deptData.length > 0) {
                                                totalRecords = deptData.reduce((sum, d) => sum + (d.total_records || 0), 0);
                                                presentRecords = deptData.reduce((sum, d) => sum + (d.present || 0), 0);
                                                avgRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
                                            }
                                        }
                                        
                                        // Fallback to mock data if no real data
                                        if (avgRate === 0) {
                                            avgRate = 75 + (index * 5);
                                        }
                                        
                                        return (
                                            <div key={dept.id || index} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {totalRecords > 0 ? `${presentRecords}/${totalRecords} records` : 'No data'}
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                avgRate >= 90 ? 'bg-green-500' :
                                                                avgRate >= 75 ? 'bg-yellow-500' :
                                                                avgRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.min(avgRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="ml-4 text-sm font-medium text-gray-900">
                                                    {avgRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No departments available</p>
                                        <p className="text-xs mt-1">Add departments to see performance data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Status Breakdown */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Attendance Status Breakdown</h3>
                        <p className="text-sm text-gray-600">Current attendance status distribution</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Present Status */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-600">Present</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round((systemStats?.totalAttendanceRecords * (systemStats?.averageAttendanceRate || 0)) / 100)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-green-700">
                                        {systemStats?.averageAttendanceRate?.toFixed(1) || 0}% of total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Absent Status */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-red-600">Absent</p>
                                    <p className="text-2xl font-bold text-red-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round((systemStats?.totalAttendanceRecords * (100 - (systemStats?.averageAttendanceRate || 0))) / 100)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-red-700">
                                        {((100 - (systemStats?.averageAttendanceRate || 0))).toFixed(1)}% of total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Late Status */}
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-yellow-600">Late</p>
                                    <p className="text-2xl font-bold text-yellow-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round(systemStats?.totalAttendanceRecords * 0.05)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-yellow-700">~5% estimated</p>
                                </div>
                            </div>
                        </div>

                        {/* Excused Status */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-600">Excused</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round(systemStats?.totalAttendanceRecords * 0.03)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-blue-700">~3% estimated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts & Notifications */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Alerts & Notifications</h3>
                        <p className="text-sm text-gray-600">Live system alerts and notifications</p>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Critical Alerts - Low Attendance */}
                        {systemStats?.averageAttendanceRate < 70 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-red-800">Critical Alert</h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            Overall attendance rate is {systemStats?.averageAttendanceRate?.toFixed(1) || 0}% - below 70% threshold
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning Alerts - High Absence Rate */}
                        {systemStats?.averageAttendanceRate < 85 && systemStats?.averageAttendanceRate >= 70 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Attendance rate is {systemStats?.averageAttendanceRate?.toFixed(1) || 0}% - monitor closely
                                        </p>
                                        <p className="text-xs text-yellow-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Interventions Alert */}
                        {systemStats?.activeInterventions > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-orange-800">Active Interventions</h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            {systemStats?.activeInterventions} intervention{systemStats?.activeInterventions !== 1 ? 's' : ''} currently in progress
                                        </p>
                                        <p className="text-xs text-orange-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Today's Attendance Info */}
                        {systemStats?.todayAttendance > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-blue-800">Today's Activity</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            {systemStats?.todayAttendance} attendance record{systemStats?.todayAttendance !== 1 ? 's' : ''} recorded today
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Health Info */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-green-800">System Status</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        System operational - {systemStats?.totalStudents || 0} students, {systemStats?.totalTeachers || 0} teachers, {systemStats?.totalDepartments || 0} departments
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">Live data</p>
                                </div>
                            </div>
                        </div>

                        {/* No Data Alert */}
                        {(!systemStats?.totalAttendanceRecords || systemStats?.totalAttendanceRecords === 0) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-800">No Attendance Data</h4>
                                        <p className="text-sm text-gray-700 mt-1">
                                            No attendance records found. Start recording attendance to see analytics.
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={pageTitle} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Notification */}
                    {notification && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            notification.type === 'success' ? 'bg-green-100 text-green-800' :
                            notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {notification.message}
                        </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'interventions' && renderInterventions()}
                    {activeTab === 'attendance' && renderAttendance()}
                    {activeTab === 'sections' && renderSections()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}