import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AdminSecurityDialog from "@/components/common/AdminSecurityDialog";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, UserPlus, Edit, Trash2, Check, X, Shield, User, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Employee,
  SystemSection,
  SYSTEM_SECTIONS,
} from "@/types/employeeTypes";
import {
  SYSTEM_ACTIONS
} from "@/types/employee";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  canDeleteEmployee
} from "@/services/employeeService";

// Define local types if not exported from types file
type EmployeeRole = string;
interface Permission {
  section: string;
  actions: string[];
}

const ROLES = [
  { id: "admin", name: "مدير النظام" },
  { id: "manager", name: "مدير" },
  { id: "sales", name: "مبيعات" },
  { id: "warehouse", name: "مخزن" },
  { id: "shipping", name: "شحن" },
  { id: "delivery", name: "توصيل" },
  { id: "customer_service", name: "خدمة عملاء" },
  { id: "accountant", name: "محاسب" },
  { id: "custom", name: "مخصص" },
];

const EmployeesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // useQuery for employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const data = await getEmployees();
      return data;
    },
    refetchInterval: 10000, // Smart Polling
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sections, setSections] = useState<Permission[]>([]); // Assuming SectionPermission is equivalent to Permission

  // Security Dialog State
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // بيانات الموظف الجديد
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "custom" as EmployeeRole | "custom",
    status: "active",
    avatar: "",
  });

  // الأقسام المتاحة للموظف المحدد
  const [selectedSections, setSelectedSections] = useState<SystemSection[]>([]);

  // الأقسام المتاحة للموظف الجديد
  const [newEmployeeSections, setNewEmployeeSections] = useState<SystemSection[]>([]);

  // حالة إظهار/إخفاء كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // تهيئة الصلاحيات عند التحميل
  useEffect(() => {
    initializeSections();
  }, []);

  // تهيئة الأقسام المتاحة للموظف الجديد
  const initializeSections = () => {
    setNewEmployeeSections(["dashboard"]);
  };

  // تصفية الموظفين حسب البحث
  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    return (
      employee.name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.phone?.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  // الحصول على اسم الدور بالعربية
  const getRoleName = (role: EmployeeRole): string => {
    switch (role) {
      case "admin": return "مدير النظام";
      case "manager": return "مدير";
      case "sales": return "مبيعات";
      case "warehouse": return "مخزن";
      case "shipping": return "شحن";
      case "delivery": return "توصيل";
      case "customer_service": return "خدمة عملاء";
      case "accountant": return "محاسب";
      default: return role;
    }
  };

  // الحصول على لون الدور
  const getRoleColor = (role: EmployeeRole): string => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "manager": return "bg-purple-100 text-purple-800";
      case "sales": return "bg-blue-100 text-blue-800";
      case "warehouse": return "bg-green-100 text-green-800";
      case "shipping": return "bg-yellow-100 text-yellow-800";
      case "delivery": return "bg-orange-100 text-orange-800";
      case "customer_service": return "bg-pink-100 text-pink-800";
      case "accountant": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // إعداد الأقسام المتاحة للموظف للتحرير
  const handleSecureAction = (action: () => void) => {
    setPendingAction(() => action);
    setIsSecurityOpen(true);
  };

  const handleSecuritySuccess = () => {
    setIsSecurityOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const setupSectionsForEdit = (employee: Employee) => {
    if (employee.accessibleSections) {
      setSelectedSections(employee.accessibleSections);
    } else if (employee.permissions) {
      const sections = employee.permissions.map(permission => permission.section as SystemSection);
      setSelectedSections(sections);
    } else {
      setSelectedSections(["dashboard"]);
    }
  };

  // تحويل الأقسام المحددة إلى مصفوفة Permission
  const getPermissionsFromSections = (sections: SystemSection[]): Permission[] => {
    return sections.map(section => ({
      section,
      actions: [...SYSTEM_ACTIONS]
    }));
  };

  // إضافة موظف جديد
  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      if (newEmployeeSections.length === 0) {
        toast.error("يرجى تحديد قسم واحد على الأقل للموظف");
        return;
      }

      const employeeWithSections = {
        ...newEmployee,
        isActive: true,
        status: newEmployee.status as 'active' | 'inactive',
        role: newEmployee.role.toLowerCase(), // Ensure lowercase
        accessibleSections: newEmployeeSections,
        permissions: getPermissionsFromSections(newEmployeeSections)
      };

      const addedEmployee = await addEmployee(employeeWithSections as any);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });

      setNewEmployee({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "sales", // Default to sales instead of custom
        status: "active",
        avatar: "",
      });

      initializeSections();
      setIsAddDialogOpen(false);
      toast.success("تم إضافة الموظف بنجاح");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "حدث خطأ أثناء إضافة الموظف");
      } else {
        toast.error("حدث خطأ أثناء إضافة الموظف");
      }
    }
  };

  // تحديث بيانات موظف
  const handleUpdateEmployee = async () => {
    try {
      if (!selectedEmployee) return;

      const employeeToUpdate = {
        ...selectedEmployee,
        role: selectedEmployee.role.toLowerCase(),
        accessibleSections: selectedSections,
        permissions: getPermissionsFromSections(selectedSections)
      };

      const updatedEmployee = await updateEmployee(selectedEmployee.id, employeeToUpdate);
      if (updatedEmployee) {
        await queryClient.invalidateQueries({ queryKey: ["employees"] });
        setSelectedEmployee(null);
        setIsEditDialogOpen(false);
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        toast.error("حدث خطأ أثناء تحديث بيانات الموظف");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "حدث خطأ أثناء تحديث بيانات الموظف");
      } else {
        toast.error("حدث خطأ أثناء تحديث بيانات الموظف");
      }
    }
  };

  // تحديث صلاحيات موظف
  const handleUpdateSections = async () => {
    try {
      if (!selectedEmployee) return;

      const updatedEmployee = await updateEmployee(selectedEmployee.id, {
        accessibleSections: selectedSections,
        permissions: getPermissionsFromSections(selectedSections)
      });

      if (updatedEmployee) {
        await queryClient.invalidateQueries({ queryKey: ["employees"] });
        setSelectedEmployee(null);
        setIsPermissionsDialogOpen(false);
        toast.success("تم تحديث صلاحيات الموظف بنجاح");
      } else {
        toast.error("حدث خطأ أثناء تحديث صلاحيات الموظف");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "حدث خطأ أثناء تحديث صلاحيات الموظف");
      } else {
        toast.error("حدث خطأ أثناء تحديث صلاحيات الموظف");
      }
    }
  };

  // حذف موظف
  const handleDeleteEmployee = async () => {
    try {
      if (!selectedEmployee) return;

      const deleteCheck = await canDeleteEmployee(selectedEmployee.id);
      if (!deleteCheck.canDelete) {
        toast.error(deleteCheck.reason || "لا يمكن حذف هذا الموظف");
        setIsDeleteDialogOpen(false);
        return;
      }

      const success = await deleteEmployee(selectedEmployee.id);
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ["employees"] });
        setSelectedEmployee(null);
        setIsDeleteDialogOpen(false);
        toast.success("تم حذف الموظف بنجاح");
      } else {
        toast.error("حدث خطأ أثناء حذف الموظف");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حذف الموظف");
      setIsDeleteDialogOpen(false);
    }
  };

  if (!hasPermission("employees")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500">غير مصرح بالوصول</h1>
          <p className="text-gray-500 mt-2">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            العودة إلى لوحة التحكم
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الموظفين</h1>
            <p className="text-muted-foreground">
              إدارة حسابات الموظفين وصلاحياتهم
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="بحث..."
                className="w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {hasPermission("employees", "create") && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                إضافة موظف
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الموظفين</CardTitle>
            <CardDescription>
              {filteredEmployees.length} موظف
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-10">
                <User className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">لا يوجد موظفين</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "لا توجد نتائج مطابقة لبحثك" : "لم يتم إضافة أي موظفين بعد"}
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">الصورة</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-center">البريد الإلكتروني</TableHead>
                      <TableHead className="text-center">رقم الهاتف</TableHead>
                      <TableHead className="text-center">الدور</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
                              {employee.avatar ? (
                                <img
                                  src={employee.avatar}
                                  alt={employee.name}
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      const userIcon = document.createElement('div');
                                      userIcon.className = "flex items-center justify-center w-full h-full bg-gray-200 text-gray-500";
                                      userIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
                                      parent.appendChild(userIcon);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                                  <User className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {employee.name}
                            {employee.role === 'admin' && (
                              <div title="مدير النظام محمي">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{employee.email}</TableCell>
                        <TableCell className="text-center">{employee.phone || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getRoleColor(employee.role)}>
                            {getRoleName(employee.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={employee.isActive ? "default" : "destructive"}
                            className={employee.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {employee.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasPermission("employees", "edit") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleSecureAction(() => {
                                    setSelectedEmployee({ ...employee, password: '' });
                                    setupSectionsForEdit(employee);
                                    setIsEditDialogOpen(true);
                                  });
                                }}
                                className="h-8 w-8 text-blue-600"
                                title="تعديل الموظف والصلاحيات"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("employees", "delete") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleSecureAction(() => {
                                    setSelectedEmployee(employee);
                                    setIsDeleteDialogOpen(true);
                                  });
                                }}
                                className="h-8 w-8 text-red-600"
                                disabled={employee.id === user?.id}
                                title="حذف الموظف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setShowPassword(false);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات الموظف الجديد وحدد صلاحياته
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            {/* Avatar and inputs... simplified for brevity but full in real code if I copy it all 
                 I should copy the full content of dialogs as they were valid
             */}
            <div className="flex items-center justify-center mb-2">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2 overflow-hidden bg-gray-100 rounded-full">
                  {newEmployee.avatar ? (
                    <img src={newEmployee.avatar} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="avatar" className="text-xs text-center">صورة الموظف</Label>
                  <Input id="avatar" type="file" accept="image/*" className="w-48 text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewEmployee({ ...newEmployee, avatar: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="الاسم" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} placeholder="Email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} placeholder="Phone" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">المسمى الوظيفي</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(val) => setNewEmployee({ ...newEmployee, role: val })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="status"
                    checked={newEmployee.status === 'active'}
                    onCheckedChange={(c) => setNewEmployee({ ...newEmployee, status: c ? 'active' : 'inactive' })}
                  />
                  <Label htmlFor="status">حساب نشط</Label>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">الأقسام المتاحة</h3>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setNewEmployeeSections([...SYSTEM_SECTIONS])} className="text-xs px-2 py-1">الكل</Button>
                  <Button variant="outline" size="sm" onClick={() => initializeSections()} className="text-xs px-2 py-1">إلغاء</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                {SYSTEM_SECTIONS.map((section) => (
                  <div key={section} className="flex items-center space-x-2 space-x-reverse p-1">
                    <Checkbox
                      id={`new-section-${section}`}
                      checked={newEmployeeSections.includes(section)}
                      onCheckedChange={(checked) => {
                        if (checked) setNewEmployeeSections([...newEmployeeSections, section]);
                        else setNewEmployeeSections(newEmployeeSections.filter(s => s !== section));
                      }}
                    />
                    <Label htmlFor={`new-section-${section}`} className="text-xs">{getSectionName(section)}</Label>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <DialogFooter className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleAddEmployee} className="flex-1"><UserPlus className="w-4 h-4 ml-2" /> إضافة الموظف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminSecurityDialog
        isOpen={isSecurityOpen}
        onClose={() => {
          setIsSecurityOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleSecuritySuccess}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>تعديل بيانات {selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid gap-4 py-4">
              {/* Simplified edit inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم</Label>
                  <Input value={selectedEmployee.name} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={selectedEmployee.email} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور (اختياري - اتركها فارغة لعدم التغيير)</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="أدخل كلمة مرور جديدة"
                    value={selectedEmployee.password || ""}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select
                    value={selectedEmployee.role}
                    onValueChange={(val) => setSelectedEmployee({ ...selectedEmployee, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      checked={Boolean(selectedEmployee.isActive)}
                      onCheckedChange={(c) => setSelectedEmployee({ ...selectedEmployee, isActive: Boolean(c) })}
                    />
                    <Label>نشط</Label>
                  </div>
                </div>
              </div>

              {selectedEmployee.role !== 'admin' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">الأقسام المتاحة</h3>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedSections([...SYSTEM_SECTIONS])}>الكل</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedSections(["dashboard"])}>الافتراضي</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2 bg-gray-50/50">
                      {SYSTEM_SECTIONS.map((section) => (
                        <div key={section} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`edit-section-${section}`}
                            checked={selectedSections.includes(section)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedSections([...selectedSections, section]);
                              else setSelectedSections(selectedSections.filter(s => s !== section));
                            }}
                          />
                          <Label htmlFor={`edit-section-${section}`} className="text-xs">{getSectionName(section)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpdateEmployee}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل أقسام الموظف</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="py-4">
              <div className="flex justify-between mb-4">
                <h3>الأقسام المتاحة</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedSections([...SYSTEM_SECTIONS])}>الكل</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSections(["dashboard"])}>إلغاء</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SYSTEM_SECTIONS.map((section) => (
                  <div key={section} className="flex items-center space-x-2 space-x-reverse border p-2 rounded">
                    <Checkbox
                      checked={selectedSections.includes(section)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedSections([...selectedSections, section]);
                        else setSelectedSections(selectedSections.filter(s => s !== section));
                      }}
                    />
                    <Label>{getSectionName(section)}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpdateSections}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف الموظف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف {selectedEmployee?.name}؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteEmployee}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

// Helper functions
const getSectionName = (section: string): string => {
  const names: Record<string, string> = {
    dashboard: "الرئيسية",
    products: "المنتجات",
    categories: "الأقسام",
    orders: "الطلبات",
    warehouse: "المخزن",
    shipping: "الشحن",
    delivery: "جاري التوصيل",
    archive: "أرشيف الطلبات",
    marketers: "المسوقين",
    commissions: "العمولات",
    "shipping-settings": "إعدادات الشحن",
    reports: "التقارير",
    settings: "الإعدادات",
    employees: "الموظفين",
    "site-settings": "إعدادات الموقع"
  };
  return names[section] || section;
};

export default EmployeesPage;
