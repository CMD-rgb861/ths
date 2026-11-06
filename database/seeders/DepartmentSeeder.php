<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $rows = $this->departmentRows();

        if (empty($rows)) {
            return;
        }

        Department::upsert(
            $rows,
            ['id'],
            ['name', 'shorten', 'parent_office_id', 'icon', 'updated_by', 'created_at', 'update_at']
        );
    }

    protected function departmentRows(): array
    {
        return [
            ['id' => 1, 'name' => 'Office of the University President', 'shorten' => 'OUP', 'parent_office_id' => null, 'icon' => 'fa fa-university', 'updated_by' => 1, 'created_at' => '2023-12-11 22:28:51', 'update_at' => '2023-12-11 22:28:50'],
            ['id' => 2, 'name' => 'Office of the Vice President for Administration and Finance', 'shorten' => 'VPAF', 'parent_office_id' => 1, 'icon' => 'fa fa-graduation-cap', 'updated_by' => 1, 'created_at' => '2024-02-21 14:13:08', 'update_at' => '2024-02-21 14:13:07'],
            ['id' => 3, 'name' => 'Office of the Vice President for Student Development', 'shorten' => 'VPSD', 'parent_office_id' => 1, 'icon' => 'fa fa-building', 'updated_by' => 1, 'created_at' => '2024-02-21 14:13:26', 'update_at' => '2024-02-23 09:45:31'],
            ['id' => 4, 'name' => 'Office of the Vice President for Research, Innovation, and Extension', 'shorten' => 'VPRIE', 'parent_office_id' => 1, 'icon' => 'fa fa-user-plus', 'updated_by' => 1, 'created_at' => '2024-02-21 14:15:10', 'update_at' => '2024-02-21 14:15:09'],
            ['id' => 5, 'name' => 'Office of the Vice President for Academic Services', 'shorten' => 'VPAS', 'parent_office_id' => 1, 'icon' => 'fa fa-calculator', 'updated_by' => 1, 'created_at' => '2024-02-23 09:17:35', 'update_at' => '2024-02-23 09:17:35'],
            ['id' => 6, 'name' => 'Office of the Chief Administration Officer - Administration', 'shorten' => 'CAOA', 'parent_office_id' => 2, 'icon' => 'fa fa-desktop', 'updated_by' => 1, 'created_at' => '2024-02-26 16:50:53', 'update_at' => '2024-02-26 16:50:53'],
            ['id' => 7, 'name' => 'Office of the Chief Administration Officer - Finance', 'shorten' => 'CAOF', 'parent_office_id' => 2, 'icon' => null, 'updated_by' => 1, 'created_at' => '2026-03-26 13:24:14', 'update_at' => '2026-03-26 13:24:13'],
            ['id' => 8, 'name' => 'Legal Office', 'shorten' => 'LEGAL', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:15:55', 'update_at' => '2024-05-31 10:15:55'],
            ['id' => 9, 'name' => 'Alumni Affairs Office', 'shorten' => 'AAO', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:20:41', 'update_at' => '2024-05-31 10:20:40'],
            ['id' => 10, 'name' => 'International Affairs and External Linkages Office', 'shorten' => 'IAEL', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:23:32', 'update_at' => '2024-05-31 10:23:33'],
            ['id' => 11, 'name' => 'Planning Office', 'shorten' => 'PO', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:24:46', 'update_at' => '2024-05-31 10:24:45'],
            ['id' => 12, 'name' => 'Public Affairs and Marketing Communication Office', 'shorten' => 'PAMCO', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:25:30', 'update_at' => '2024-05-31 10:25:29'],
            ['id' => 13, 'name' => 'Gender and Development Office', 'shorten' => 'GAD', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:27:10', 'update_at' => '2024-05-31 10:27:09'],
            ['id' => 14, 'name' => 'Institutional Performing Arts Office', 'shorten' => 'IPAO', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:27:42', 'update_at' => '2024-05-31 10:27:41'],
            ['id' => 15, 'name' => 'Internal Audit Office', 'shorten' => 'IAS', 'parent_office_id' => 1, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:28:10', 'update_at' => '2024-05-31 10:28:09'],
            ['id' => 16, 'name' => 'Supply and Property Management Office', 'shorten' => 'SPMO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:28:56', 'update_at' => '2024-05-31 10:28:56'],
            ['id' => 17, 'name' => 'Human Resource Management Office', 'shorten' => 'HRMO', 'parent_office_id' => 6, 'icon' => 'fa fa-user-plus', 'updated_by' => 1, 'created_at' => '2024-05-31 10:29:31', 'update_at' => '2024-05-31 10:29:30'],
            ['id' => 18, 'name' => 'Physical Plants and Facilities Office', 'shorten' => 'PPFO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:30:16', 'update_at' => '2024-05-31 10:30:16'],
            ['id' => 19, 'name' => 'IT Support Office', 'shorten' => 'ITSO', 'parent_office_id' => 6, 'icon' => 'fa fa-desktop', 'updated_by' => 1, 'created_at' => '2024-05-31 10:30:48', 'update_at' => '2024-05-31 10:30:48'],
            ['id' => 20, 'name' => 'General Services Office', 'shorten' => 'GSO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:31:14', 'update_at' => '2024-05-31 10:31:13'],
            ['id' => 21, 'name' => 'Security Office', 'shorten' => 'SO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:31:38', 'update_at' => '2024-05-31 10:31:37'],
            ['id' => 22, 'name' => 'Human Resource Development Center Office', 'shorten' => 'HRDC', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:32:13', 'update_at' => '2024-05-31 10:32:12'],
            ['id' => 23, 'name' => 'Income Generating Office', 'shorten' => 'IGO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:32:45', 'update_at' => '2024-05-31 10:32:45'],
            ['id' => 24, 'name' => 'Medical Services Office', 'shorten' => 'MSO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:33:15', 'update_at' => '2024-05-31 10:33:12'],
            ['id' => 25, 'name' => 'Integrated Multimedia Office', 'shorten' => 'IMO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:33:41', 'update_at' => '2024-05-31 10:33:40'],
            ['id' => 26, 'name' => 'Quality Management System on Administrative Services Office', 'shorten' => 'QMS-ADMIN', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:34:46', 'update_at' => '2024-05-31 10:34:46'],
            ['id' => 27, 'name' => 'Housing Service Office', 'shorten' => 'HSO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:35:28', 'update_at' => '2024-05-31 10:35:27'],
            ['id' => 28, 'name' => 'Accounting Office', 'shorten' => 'AO', 'parent_office_id' => 7, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:36:01', 'update_at' => '2024-05-31 10:36:00'],
            ['id' => 29, 'name' => 'Budget Office', 'shorten' => 'BO', 'parent_office_id' => 7, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:36:32', 'update_at' => '2024-05-31 10:36:32'],
            ['id' => 30, 'name' => 'Cash Management Office', 'shorten' => 'CMO', 'parent_office_id' => 7, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:36:54', 'update_at' => '2024-05-31 10:36:53'],
            ['id' => 31, 'name' => 'Guidance Office', 'shorten' => 'GO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:58:27', 'update_at' => '2024-05-31 10:58:26'],
            ['id' => 32, 'name' => 'Sports Development Office', 'shorten' => 'SDO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:58:55', 'update_at' => '2024-05-31 10:58:54'],
            ['id' => 33, 'name' => 'Student Organization and Activities Office', 'shorten' => 'SOAO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 10:59:35', 'update_at' => '2024-05-31 10:59:32'],
            ['id' => 34, 'name' => 'Scholarship and Financial Assistance Office', 'shorten' => 'SFAO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:00:11', 'update_at' => '2024-05-31 11:00:11'],
            ['id' => 35, 'name' => 'Students with Special Needs Office', 'shorten' => 'SSNO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:00:37', 'update_at' => '2024-05-31 11:00:35'],
            ['id' => 36, 'name' => 'Students Performing Arts Office', 'shorten' => 'SPAO', 'parent_office_id' => 3, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:01:08', 'update_at' => '2024-05-31 11:01:07'],
            ['id' => 37, 'name' => 'Office of the Research and Innovation', 'shorten' => 'RIO', 'parent_office_id' => 4, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:01:53', 'update_at' => '2024-05-31 11:01:52'],
            ['id' => 38, 'name' => 'Community Extension Services Office', 'shorten' => 'CESO', 'parent_office_id' => 4, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:02:39', 'update_at' => '2024-05-31 11:02:38'],
            ['id' => 39, 'name' => 'Knowledge Creation and Innovation Center', 'shorten' => 'KCIC', 'parent_office_id' => 37, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:04:21', 'update_at' => '2024-05-31 11:04:20'],
            ['id' => 40, 'name' => 'Center for Teacher Education, Research, Technology and Innovation', 'shorten' => 'CTERTI', 'parent_office_id' => 37, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:05:40', 'update_at' => '2024-05-31 11:05:39'],
            ['id' => 41, 'name' => 'Center for Language and Cultural Studies', 'shorten' => 'CLCS', 'parent_office_id' => 37, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:06:17', 'update_at' => '2024-05-31 11:06:17'],
            ['id' => 42, 'name' => 'Center for Health and Environmental Studies', 'shorten' => 'CHES', 'parent_office_id' => 37, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:07:07', 'update_at' => '2024-05-31 11:07:07'],
            ['id' => 43, 'name' => 'Research Ethics Office', 'shorten' => 'REO', 'parent_office_id' => 38, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:08:06', 'update_at' => '2024-05-31 11:08:06'],
            ['id' => 44, 'name' => 'Curriculum Development Office', 'shorten' => 'CDO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:11:15', 'update_at' => '2024-05-31 11:11:16'],
            ['id' => 45, 'name' => "Registrar's Office", 'shorten' => 'RO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:11:15', 'update_at' => '2024-05-31 11:11:14'],
            ['id' => 46, 'name' => 'Center for Continuing Education and Lifelong Learning', 'shorten' => 'CCELL', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:12:15', 'update_at' => '2024-05-31 11:12:15'],
            ['id' => 47, 'name' => 'National Service Training Program Office', 'shorten' => 'NSTP', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:13:26', 'update_at' => '2024-05-31 11:13:25'],
            ['id' => 48, 'name' => 'University Library Office', 'shorten' => 'ULO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:14:14', 'update_at' => '2024-05-31 11:14:12'],
            ['id' => 49, 'name' => 'Admissions Office', 'shorten' => 'ADMO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:14:47', 'update_at' => '2024-05-31 11:14:46'],
            ['id' => 50, 'name' => 'Office of the Dean, Graduate School', 'shorten' => 'GS', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:15:16', 'update_at' => '2024-05-31 11:15:15'],
            ['id' => 51, 'name' => 'Expanded Tertiary Education Equivalency and Accreditation Program Office', 'shorten' => 'ETEEAPO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:16:36', 'update_at' => '2024-05-31 11:16:36'],
            ['id' => 52, 'name' => "IM's Production, Utilization and Evaluation Office", 'shorten' => 'IMPUEO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:17:20', 'update_at' => '2024-05-31 11:17:19'],
            ['id' => 53, 'name' => 'Quality Management System on Academic Services Office', 'shorten' => 'QMS-ACAD', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:23:50', 'update_at' => '2024-05-31 11:23:49'],
            ['id' => 54, 'name' => 'Office of the Dean, College of Management and Entrepreneurship', 'shorten' => 'CME', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:24:44', 'update_at' => '2024-05-31 11:24:43'],
            ['id' => 55, 'name' => 'Office of the Dean, College of Education', 'shorten' => 'COE', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:26:25', 'update_at' => '2024-05-31 11:26:24'],
            ['id' => 56, 'name' => 'Office of the Dean, College of Arts and Sciences', 'shorten' => 'CAS', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:26:50', 'update_at' => '2024-05-31 11:26:49'],
            ['id' => 57, 'name' => 'Laboratory Office', 'shorten' => 'LO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:27:13', 'update_at' => '2024-05-31 11:27:12'],
            ['id' => 58, 'name' => 'Sentro ng Wika at Kultura Office', 'shorten' => 'SWKO', 'parent_office_id' => 5, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:28:11', 'update_at' => '2024-05-31 11:28:11'],
            ['id' => 59, 'name' => 'Distance Education Department', 'shorten' => 'DED', 'parent_office_id' => 50, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:30:41', 'update_at' => '2024-05-31 11:30:40'],
            ['id' => 60, 'name' => 'Masters Program Department', 'shorten' => 'MPD', 'parent_office_id' => 50, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:31:02', 'update_at' => '2024-05-31 11:31:01'],
            ['id' => 61, 'name' => 'Doctoral Programs Department', 'shorten' => 'DPD', 'parent_office_id' => 50, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:32:53', 'update_at' => '2024-05-31 11:32:52'],
            ['id' => 62, 'name' => 'Office of the Deputy Dean, College of Education', 'shorten' => 'DDCOE', 'parent_office_id' => 55, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:33:14', 'update_at' => '2025-08-06 10:56:29'],
            ['id' => 63, 'name' => 'Elementary Education Department', 'shorten' => 'EED', 'parent_office_id' => 55, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:33:44', 'update_at' => '2024-05-31 11:33:43'],
            ['id' => 64, 'name' => 'Integrated Laboratory School Office', 'shorten' => 'ILS', 'parent_office_id' => 55, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:34:34', 'update_at' => '2024-05-31 11:34:34'],
            ['id' => 65, 'name' => 'LNU-San Isidro Campus', 'shorten' => 'LNU-SI', 'parent_office_id' => 55, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:36:03', 'update_at' => '2024-05-31 11:36:02'],
            ['id' => 66, 'name' => 'LNU House', 'shorten' => 'H', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:37:06', 'update_at' => '2024-05-31 11:37:05'],
            ['id' => 67, 'name' => 'LNU Guest House', 'shorten' => 'GH', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:37:47', 'update_at' => '2024-05-31 11:37:46'],
            ['id' => 68, 'name' => 'Hotel Cresencia', 'shorten' => 'HC', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:38:45', 'update_at' => '2024-05-31 11:38:45'],
            ['id' => 69, 'name' => 'Office of the Deputy Dean, College of Management and Entrepreneurship', 'shorten' => 'DDCME', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:39:36', 'update_at' => '2025-08-06 10:56:51'],
            ['id' => 70, 'name' => 'Entrepreneurship Department', 'shorten' => 'ED', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:40:00', 'update_at' => '2024-05-31 11:39:59'],
            ['id' => 71, 'name' => 'Arts and Humanities Department', 'shorten' => 'AHD', 'parent_office_id' => 56, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:40:31', 'update_at' => '2024-05-31 11:40:30'],
            ['id' => 72, 'name' => 'Applied Sciences Department', 'shorten' => 'ASD', 'parent_office_id' => 56, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:41:05', 'update_at' => '2024-05-31 11:41:04'],
            ['id' => 73, 'name' => 'Counseling Office', 'shorten' => 'CO', 'parent_office_id' => 31, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:42:58', 'update_at' => '2024-05-31 11:42:57'],
            ['id' => 74, 'name' => 'Testing Office', 'shorten' => 'TO', 'parent_office_id' => 31, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:43:19', 'update_at' => '2024-05-31 11:43:18'],
            ['id' => 75, 'name' => 'Career and Placement Office', 'shorten' => 'CPO', 'parent_office_id' => 31, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:43:49', 'update_at' => '2024-05-31 11:43:48'],
            ['id' => 76, 'name' => 'Student Organization Office', 'shorten' => 'SOO', 'parent_office_id' => 33, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:45:14', 'update_at' => '2024-05-31 11:45:14'],
            ['id' => 77, 'name' => 'Student Publication Office', 'shorten' => 'SPO', 'parent_office_id' => 33, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:45:42', 'update_at' => '2024-05-31 11:45:41'],
            ['id' => 78, 'name' => 'Student Ambassadors Office', 'shorten' => 'SAO', 'parent_office_id' => 33, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:46:03', 'update_at' => '2024-05-31 11:46:02'],
            ['id' => 79, 'name' => 'Foreign/Multi-Cultural Student Services Office', 'shorten' => 'FMCSSO', 'parent_office_id' => 35, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:47:18', 'update_at' => '2024-05-31 11:47:18'],
            ['id' => 80, 'name' => 'Intellectual Property Office', 'shorten' => 'IPO', 'parent_office_id' => 39, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:51:00', 'update_at' => '2024-05-31 11:50:56'],
            ['id' => 81, 'name' => 'Technology and Business Incubation Office', 'shorten' => 'TBIO', 'parent_office_id' => 39, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:51:33', 'update_at' => '2024-05-31 11:51:33'],
            ['id' => 82, 'name' => 'Data Analysis Office', 'shorten' => 'DAO', 'parent_office_id' => 39, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:51:55', 'update_at' => '2024-05-31 11:51:54'],
            ['id' => 83, 'name' => 'Office of the Journal Manager', 'shorten' => 'OJM', 'parent_office_id' => 4, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-05-31 11:53:46', 'update_at' => '2024-05-31 11:53:45'],
            ['id' => 84, 'name' => 'Records Management Office', 'shorten' => 'RMO', 'parent_office_id' => 6, 'icon' => null, 'updated_by' => 1, 'created_at' => '2024-06-05 10:26:46', 'update_at' => '2024-06-05 10:26:45'],
            ['id' => 85, 'name' => 'Office of Research, Innovation and Extension', 'shorten' => 'ORIE', 'parent_office_id' => 4, 'icon' => null, 'updated_by' => 1, 'created_at' => '2025-06-10 10:10:48', 'update_at' => '2025-06-10 10:10:48'],
            ['id' => 86, 'name' => 'College Research and Innovation Coordinator - COE', 'shorten' => 'COE.CRIC', 'parent_office_id' => 55, 'icon' => null, 'updated_by' => 1, 'created_at' => '2025-07-04 10:09:09', 'update_at' => '2025-07-04 10:19:08'],
            ['id' => 87, 'name' => 'College Research and Innovation Coordinator - CME', 'shorten' => 'CME.CRIC', 'parent_office_id' => 54, 'icon' => null, 'updated_by' => 1, 'created_at' => '2025-07-04 10:10:19', 'update_at' => '2025-07-04 10:10:18'],
            ['id' => 88, 'name' => 'College Research and Innovation Coordinator - CAS', 'shorten' => 'CAS.CRIC', 'parent_office_id' => 56, 'icon' => null, 'updated_by' => 1, 'created_at' => '2025-07-04 10:10:44', 'update_at' => '2025-07-04 10:10:45'],
            ['id' => 89, 'name' => 'Office of the Deputy Dean, College of Arts and Sciences', 'shorten' => 'DDCAS', 'parent_office_id' => 56, 'icon' => null, 'updated_by' => 1, 'created_at' => '2025-08-06 11:00:25', 'update_at' => '2025-08-06 11:00:25'],
            ['id' => 90, 'name' => 'Regional Institute for Tourism and Hospitality Management Studies', 'shorten' => 'RITHMS', 'parent_office_id' => 85, 'icon' => null, 'updated_by' => 1, 'created_at' => '2026-06-22 09:19:37', 'update_at' => '2026-06-22 09:19:37'],
        ];
    }
}
