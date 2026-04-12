# دليل إنشاء تاب جديدة (Create New Tab Guide)

عند إنشاء أي تاب تحليلية جديدة في النظام، يجب الالتزام باستخدام المكونات الموحدة (Standardized Components) لضمان ثبات التصميم وتجربة المستخدم.

---

## 1. الاستيراد (Imports)
يجب استيراد المكونات الموحدة من مسار `../lib/` (أو المسار المناسب حسب موقع الملف):

```javascript
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
```

---

## 2. مربع البحث (Search Bar)
بدلاً من استخدام `input` تقليدي، استخدم المكون الموحد:

```javascript
<SearchBar_db 
    value={searchTerm} 
    onChange={setSearchTerm} 
    placeholder="Search..." 
    className="custom-class" 
/>
```

---

## 3. القوائم المنسدلة (Dropdown List)
استخدم المكون الموحد للقوائم، وهو يدعم البحث الداخلي تلقائياً إذا كانت القائمة طويلة:

```javascript
<DropDownList_db 
    options={[
        { value: 'all', label: 'الكل' },
        { value: 'option1', label: 'خيار 1' }
    ]}
    value={selectedValue}
    onChange={setSelectedValue}
    placeholder="اختر..."
    searchable={true} // اختياري: لتفعيل البحث داخل الـ Dropdown
/>
```

---

## 4. شاشة "لا توجد بيانات" (No Data)
يجب استخدام المكون الموحد عند عدم وجود نتائج (بعد الفلترة أو في حالة البيانات الفارغة):

### في حالة العرض العادي (Div):
```javascript
{data.length === 0 && <NoData_db message="لم يتم العثور على بيانات" />}
```

### داخل الجداول (Table Row):
```javascript
{data.length === 0 && (
    <NoData_db 
        isTable={true} 
        colSpan={7} // عدد أعمدة الجدول
        message="لا توجد بيانات" 
    />
)}
```

---

## ملاحظات هامة:
*   المكونات تعتمد على ملف `Components_db.css` الموحد.
*   تم استخدام خط **DM Sans** لضمان شكل "Premium".
*   يجب وضع جميع المكونات الجديدة داخل فولدر `app/lib/` وتسميتها بلاحقة `_db`.
