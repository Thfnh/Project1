import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getFields,
  updateFieldPrice,
  createField
} from "../../services/field_service";

import {
  getAllBookings,
  updateBookingStatus
} from "../../services/booking_service";

import "./Admin.css";


/* =========================================================
   DEFAULT FIELD
========================================================= */

const EMPTY_FIELD = {
  FieldName: "",
  FieldType: "5 player",
  Location: "",
  Image: "",
  Status: "AVAILABLE",
  StartTime: "06:00",
  EndTime: "16:00",
  Price: ""
};


/* =========================================================
   BOOKING STATUS
========================================================= */

const BOOKING_STATUS = {

  PENDING: {
    label: "Chờ xác nhận",
    background: "#fef3c7",
    color: "#b45309"
  },

  CONFIRMED: {
    label: "Đã xác nhận",
    background: "#dcfce7",
    color: "#15803d"
  },

  CANCELLED: {
    label: "Đã hủy",
    background: "#fee2e2",
    color: "#dc2626"
  },

  COMPLETED: {
    label: "Hoàn thành",
    background: "#dbeafe",
    color: "#1d4ed8"
  }

};


function Admin() {

  /* =========================================================
     USER
  ========================================================= */

  const [user, setUser] =
    useState(null);


  /* =========================================================
     SECTION
  ========================================================= */

  const [
    activeSection,
    setActiveSection
  ] = useState("fields");


  /* =========================================================
     FIELD STATE
  ========================================================= */

  const [fields, setFields] =
    useState([]);

  const [editField, setEditField] =
    useState(null);

  const [
    showAddModal,
    setShowAddModal
  ] = useState(false);

  const [newField, setNewField] =
    useState(EMPTY_FIELD);

  const [searchText, setSearchText] =
    useState("");

  const [fieldType, setFieldType] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [
    deletingFieldID,
    setDeletingFieldID
  ] = useState(null);


  /* =========================================================
     BOOKING STATE
  ========================================================= */

  const [
    bookings,
    setBookings
  ] = useState([]);

  const [
    bookingLoading,
    setBookingLoading
  ] = useState(false);

  const [
    bookingSearch,
    setBookingSearch
  ] = useState("");

  const [
    bookingStatus,
    setBookingStatus
  ] = useState("");

  const [
    updatingBookingID,
    setUpdatingBookingID
  ] = useState(null);


  /* =========================================================
     LOAD FIELDS
  ========================================================= */

  const loadFields = async () => {

    try {

      setLoading(true);

      const data =
        await getFields();

      setFields(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "LOAD FIELDS ERROR:",
        error
      );

      alert(
        error.message ||
        "Không thể tải danh sách sân"
      );

    } finally {

      setLoading(false);
    }
  };


  /* =========================================================
     LOAD BOOKINGS
  ========================================================= */

  const loadBookings = async (
    adminUserID
  ) => {

    if (!adminUserID) {
      return;
    }

    try {

      setBookingLoading(true);

      const result =
        await getAllBookings(
          adminUserID
        );

      setBookings(
        Array.isArray(
          result.Bookings
        )
          ? result.Bookings
          : []
      );

    } catch (error) {

      console.error(
        "LOAD BOOKINGS ERROR:",
        error
      );

      alert(
        error.message ||
        "Không thể tải danh sách đặt sân"
      );

    } finally {

      setBookingLoading(false);
    }
  };


  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {

    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (storedUser) {

      try {

        const parsedUser =
          JSON.parse(
            storedUser
          );

        setUser(
          parsedUser
        );

      } catch {

        localStorage.removeItem(
          "user"
        );
      }
    }

    loadFields();

  }, []);


  /* =========================================================
     LOAD BOOKING AFTER USER
  ========================================================= */

  useEffect(() => {

    if (
      user?.UserID
      &&
      String(
        user.Role || ""
      ).toUpperCase()
      ===
      "ADMIN"
    ) {

      loadBookings(
        user.UserID
      );
    }

  }, [
    user?.UserID,
    user?.Role
  ]);


  /* =========================================================
     FIELD STATISTICS
  ========================================================= */

  const stats =
    useMemo(() => {

      const uniqueFields = [
        ...new Map(
          fields.map(
            field => [
              field.FieldID,
              field
            ]
          )
        ).values()
      ];


      return {

        total:
          uniqueFields.length,

        available:
          uniqueFields.filter(
            field =>
              field.Status
              ===
              "AVAILABLE"
          ).length,

        maintenance:
          uniqueFields.filter(
            field =>
              field.Status
              !==
              "AVAILABLE"
          ).length,

        priceSlots:
          fields.filter(
            field =>
              field.PriceID
          ).length

      };

    }, [fields]);


  /* =========================================================
     BOOKING STATISTICS
  ========================================================= */

  const bookingStats =
    useMemo(() => {

      return {

        total:
          bookings.length,

        pending:
          bookings.filter(
            booking =>
              booking.Status
              ===
              "PENDING"
          ).length,

        confirmed:
          bookings.filter(
            booking =>
              booking.Status
              ===
              "CONFIRMED"
          ).length,

        completed:
          bookings.filter(
            booking =>
              booking.Status
              ===
              "COMPLETED"
          ).length

      };

    }, [bookings]);


  /* =========================================================
     FIELD TYPES
  ========================================================= */

  const fieldTypes =
    useMemo(
      () => [

        ...new Set(
          fields
            .map(
              field =>
                field.FieldType
            )
            .filter(Boolean)
        )

      ],
      [fields]
    );


  /* =========================================================
     FILTER FIELDS
  ========================================================= */

  const filteredFields =
    useMemo(() => {

      return fields.filter(
        field => {

          const matchName =
            String(
              field.FieldName || ""
            )
              .toLowerCase()
              .includes(
                searchText
                  .trim()
                  .toLowerCase()
              );


          const matchType =
            !fieldType
            ||
            field.FieldType
            ===
            fieldType;


          const matchStatus =
            !status
            ||
            field.Status
            ===
            status;


          return (
            matchName
            &&
            matchType
            &&
            matchStatus
          );
        }
      );

    }, [
      fields,
      searchText,
      fieldType,
      status
    ]);


  /* =========================================================
     FILTER BOOKINGS
  ========================================================= */

  const filteredBookings =
    useMemo(() => {

      const keyword =
        bookingSearch
          .trim()
          .toLowerCase();


      return bookings.filter(
        booking => {

          const searchable =
            [
              booking.BookingID,
              booking.CustomerName,
              booking.Phone,
              booking.Email,
              booking.FieldName,
              booking.BookingDate
            ]
              .filter(
                value =>
                  value !== null
                  &&
                  value !== undefined
              )
              .join(" ")
              .toLowerCase();


          const matchKeyword =
            !keyword
            ||
            searchable.includes(
              keyword
            );


          const matchStatus =
            !bookingStatus
            ||
            booking.Status
            ===
            bookingStatus;


          return (
            matchKeyword
            &&
            matchStatus
          );
        }
      );

    }, [
      bookings,
      bookingSearch,
      bookingStatus
    ]);


  /* =========================================================
     HELPERS
  ========================================================= */

  const formatPrice = price =>

    Number(
      price || 0
    ).toLocaleString(
      "vi-VN"
    );


  const isValidTime = (
    startTime,
    endTime
  ) => {

    if (
      !startTime
      ||
      !endTime
    ) {

      alert(
        "Vui lòng nhập đầy đủ khung giờ"
      );

      return false;
    }


    if (
      startTime >= endTime
    ) {

      alert(
        "Giờ kết thúc phải lớn hơn giờ bắt đầu"
      );

      return false;
    }


    return true;
  };


  const updateNewField = (
    key,
    value
  ) => {

    setNewField(
      prev => ({
        ...prev,
        [key]: value
      })
    );
  };


  const updateEditField = (
    key,
    value
  ) => {

    setEditField(
      prev => ({
        ...prev,
        [key]: value
      })
    );
  };


  /* =========================================================
     ADD FIELD
  ========================================================= */

  const handleAddField =
    async () => {

      if (
        !newField
          .FieldName
          .trim()
      ) {

        alert(
          "Vui lòng nhập tên sân"
        );

        return;
      }


      if (
        !newField
          .Location
          .trim()
      ) {

        alert(
          "Vui lòng nhập địa điểm"
        );

        return;
      }


      if (
        !isValidTime(
          newField.StartTime,
          newField.EndTime
        )
      ) {

        return;
      }


      const price =
        Number(
          newField.Price
        );


      if (
        Number.isNaN(
          price
        )
        ||
        price < 0
      ) {

        alert(
          "Giá sân không hợp lệ"
        );

        return;
      }


      try {

        setAdding(true);


        await createField({

          ...newField,

          FieldName:
            newField
              .FieldName
              .trim(),

          Location:
            newField
              .Location
              .trim(),

          Price:
            price

        });


        setShowAddModal(
          false
        );


        setNewField(
          EMPTY_FIELD
        );


        await loadFields();


        alert(
          "Thêm sân thành công"
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message ||
          "Không thể thêm sân"
        );


      } finally {

        setAdding(false);
      }
    };


  /* =========================================================
     OPEN EDIT PRICE
  ========================================================= */

  const openEdit =
    field => {

      if (
        !field.PriceID
      ) {

        alert(
          "Sân này chưa có bảng giá"
        );

        return;
      }


      setEditField({

        ...field,

        StartTime:
          field.StartTime
            ?.slice(
              0,
              5
            )
          ||
          "",

        EndTime:
          field.EndTime
            ?.slice(
              0,
              5
            )
          ||
          ""

      });
    };


  /* =========================================================
     SAVE PRICE
  ========================================================= */

  const handleSaveEdit =
    async () => {

      if (
        !editField?.PriceID
      ) {

        return;
      }


      if (
        !isValidTime(
          editField.StartTime,
          editField.EndTime
        )
      ) {

        return;
      }


      const price =
        Number(
          editField.Price
        );


      if (
        Number.isNaN(
          price
        )
        ||
        price < 0
      ) {

        alert(
          "Giá sân không hợp lệ"
        );

        return;
      }


      try {

        setSaving(true);


        await updateFieldPrice(
          editField.PriceID,
          {

            StartTime:
              editField.StartTime,

            EndTime:
              editField.EndTime,

            Price:
              price

          }
        );


        setEditField(
          null
        );


        await loadFields();


        alert(
          "Cập nhật giá thành công"
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message ||
          "Không thể cập nhật"
        );


      } finally {

        setSaving(false);
      }
    };


  /* =========================================================
     DELETE FIELD
  ========================================================= */

  const handleDeleteField =
    async field => {

      const confirmDelete =
        window.confirm(

          `Bạn có chắc muốn xóa "${field.FieldName}"?\n\n`
          +
          "Toàn bộ bảng giá của sân cũng sẽ bị xóa."

        );


      if (
        !confirmDelete
      ) {

        return;
      }


      try {

        setDeletingFieldID(
          field.FieldID
        );


        const response =
          await fetch(

            `http://127.0.0.1:5000/api/fields/${field.FieldID}`,

            {
              method: "DELETE"
            }

          );


        const result =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(

            result.message
            ||
            "Không thể xóa sân"

          );
        }


        await loadFields();


        alert(
          result.message
          ||
          "Xóa sân thành công"
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message
          ||
          "Không thể xóa sân"
        );


      } finally {

        setDeletingFieldID(
          null
        );
      }
    };


  /* =========================================================
     CHANGE BOOKING STATUS
  ========================================================= */

  const handleBookingStatus =
    async (
      booking,
      newStatus
    ) => {

      if (
        !user?.UserID
      ) {

        alert(
          "Không xác định được tài khoản admin"
        );

        return;
      }


      const statusMeta =
        BOOKING_STATUS[
          newStatus
        ];


      const label =
        statusMeta?.label
        ||
        newStatus;


      const confirmed =
        window.confirm(

          `Bạn có chắc muốn chuyển đơn #${booking.BookingID} sang "${label}"?`

        );


      if (
        !confirmed
      ) {

        return;
      }


      try {

        setUpdatingBookingID(
          booking.BookingID
        );


        await updateBookingStatus(

          booking.BookingID,

          newStatus,

          user.UserID

        );


        await loadBookings(
          user.UserID
        );


        alert(
          "Cập nhật trạng thái đơn thành công"
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message
          ||
          "Không thể cập nhật trạng thái đơn"
        );


      } finally {

        setUpdatingBookingID(
          null
        );
      }
    };


  /* =========================================================
     BOOKING STATUS BADGE
  ========================================================= */

  const renderBookingStatus =
    statusValue => {

      const normalized =
        String(
          statusValue || ""
        )
          .trim()
          .toUpperCase();


      const meta =
        BOOKING_STATUS[
          normalized
        ]
        ||
        {
          label:
            normalized
            ||
            "Không xác định",

          background:
            "#e2e8f0",

          color:
            "#475569"
        };


      return (

        <span

          style={{
            display: "inline-block",
            padding: "5px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            background: meta.background,
            color: meta.color
          }}

        >

          {
            meta.label
          }

        </span>

      );
    };


  /* =========================================================
     BOOKING ACTIONS
  ========================================================= */

  const renderBookingActions =
    booking => {

      const busy =
        updatingBookingID
        ===
        booking.BookingID;


      if (
        booking.Status
        ===
        "PENDING"
      ) {

        return (

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap"
            }}
          >

            <button

              type="button"

              className="save-btn"

              disabled={
                busy
              }

              onClick={
                () =>
                  handleBookingStatus(
                    booking,
                    "CONFIRMED"
                  )
              }

            >

              {
                busy
                  ? "Đang xử lý..."
                  : "Xác nhận"
              }

            </button>


            <button

              type="button"

              className="delete-btn"

              disabled={
                busy
              }

              onClick={
                () =>
                  handleBookingStatus(
                    booking,
                    "CANCELLED"
                  )
              }

            >

              Hủy đơn

            </button>

          </div>

        );
      }


      if (
        booking.Status
        ===
        "CONFIRMED"
      ) {

        return (

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap"
            }}
          >

            <button

              type="button"

              className="save-btn"

              disabled={
                busy
              }

              onClick={
                () =>
                  handleBookingStatus(
                    booking,
                    "COMPLETED"
                  )
              }

            >

              {
                busy
                  ? "Đang xử lý..."
                  : "Hoàn thành"
              }

            </button>


            <button

              type="button"

              className="delete-btn"

              disabled={
                busy
              }

              onClick={
                () =>
                  handleBookingStatus(
                    booking,
                    "CANCELLED"
                  )
              }

            >

              Hủy đơn

            </button>

          </div>

        );
      }


      return (

        <span
          style={{
            color: "#94a3b8",
            fontSize: "13px"
          }}
        >

          Không có thao tác

        </span>

      );
    };


  /* =========================================================
     MENU
  ========================================================= */

  const handleSectionChange =
    section => {

      setActiveSection(
        section
      );


      if (
        section === "bookings"
        &&
        user?.UserID
      ) {

        loadBookings(
          user.UserID
        );
      }
    };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {

    const confirmed =
      window.confirm(
        "Bạn có muốn đăng xuất?"
      );


    if (
      !confirmed
    ) {

      return;
    }


    localStorage.removeItem(
      "user"
    );


    localStorage.removeItem(
      "bookingDraft"
    );


    window.dispatchEvent(
      new Event(
        "auth-changed"
      )
    );


    window.location.href =
      "/login";
  };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      className="admin-container"
    >

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className="sidebar"
      >

        <h2>
          ⚽ SÂN BÓNG
        </h2>


        <ul
          className="sidebar-menu"
        >

          <li>
            Tổng quan
          </li>


          <li

            className={
              activeSection
              ===
              "fields"

                ? "active"

                : ""
            }

            style={{
              cursor:
                "pointer"
            }}

            onClick={
              () =>
                handleSectionChange(
                  "fields"
                )
            }

          >

            Quản lý sân bóng

          </li>


          <li

            className={
              activeSection
              ===
              "bookings"

                ? "active"

                : ""
            }

            style={{
              cursor:
                "pointer"
            }}

            onClick={
              () =>
                handleSectionChange(
                  "bookings"
                )
            }

          >

            Quản lý đặt sân

          </li>


          <li>
            Quản lý khách hàng
          </li>

          <li>
            Quản lý nhân viên
          </li>

          <li>
            Hóa đơn & thanh toán
          </li>

          <li>
            Thống kê & báo cáo
          </li>

          <li>
            Cài đặt
          </li>

        </ul>


        <button

          type="button"

          className="logout"

          onClick={
            handleLogout
          }

        >

          ↪ Đăng xuất

        </button>

      </aside>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main
        className="admin-content"
      >

        {/* HEADER */}

        <div
          className="top-header"
        >

          <input

            placeholder={
              activeSection
              ===
              "fields"

                ? "🔍 Tìm kiếm tên sân..."

                : "🔍 Tìm mã đơn, khách hàng, sân..."
            }

            value={
              activeSection
              ===
              "fields"

                ? searchText

                : bookingSearch
            }

            onChange={
              event => {

                if (
                  activeSection
                  ===
                  "fields"
                ) {

                  setSearchText(
                    event.target.value
                  );

                } else {

                  setBookingSearch(
                    event.target.value
                  );
                }
              }
            }

          />


          <div
            className="admin-user"
          >

            <span>
              🔔
            </span>


            <div>

              <b>

                {
                  user?.FullName
                  ||
                  "Admin sân bóng"
                }

              </b>


              <small>
                Quản trị viên
              </small>

            </div>

          </div>

        </div>


        {/* =================================================
            FIELD MANAGEMENT
        ================================================= */}

        {
          activeSection
          ===
          "fields"
          &&
          (

            <>

              {/* TITLE */}

              <div
                className="title-row"
              >

                <h1>
                  QUẢN LÝ SÂN BÓNG
                </h1>


                <button

                  type="button"

                  className="add-btn"

                  onClick={
                    () =>
                      setShowAddModal(
                        true
                      )
                  }

                >

                  + Thêm sân mới

                </button>

              </div>


              {/* STATISTICS */}

              <div
                className="cards"
              >

                <div
                  className="card"
                >

                  <p>
                    Tổng số sân
                  </p>

                  <h2>
                    {
                      stats.total
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Đang hoạt động
                  </p>

                  <h2>
                    {
                      stats.available
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Đang bảo trì
                  </p>

                  <h2>
                    {
                      stats.maintenance
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Khung bảng giá
                  </p>

                  <h2>
                    {
                      stats.priceSlots
                    }
                  </h2>

                </div>

              </div>


              {/* FILTER */}

              <div
                className="filter"
              >

                <input

                  placeholder="🔍 Tìm kiếm tên sân..."

                  value={
                    searchText
                  }

                  onChange={
                    event =>
                      setSearchText(
                        event.target.value
                      )
                  }

                />


                <select

                  value={
                    fieldType
                  }

                  onChange={
                    event =>
                      setFieldType(
                        event.target.value
                      )
                  }

                >

                  <option value="">
                    Loại sân
                  </option>


                  {
                    fieldTypes.map(
                      type => (

                        <option
                          key={
                            type
                          }
                          value={
                            type
                          }
                        >

                          {type}

                        </option>

                      )
                    )
                  }

                </select>


                <select

                  value={
                    status
                  }

                  onChange={
                    event =>
                      setStatus(
                        event.target.value
                      )
                  }

                >

                  <option value="">
                    Trạng thái
                  </option>

                  <option value="AVAILABLE">
                    AVAILABLE
                  </option>

                  <option value="MAINTENANCE">
                    MAINTENANCE
                  </option>

                </select>

              </div>


              {/* FIELD TABLE */}

              <div
                className="table-box"
              >

                <table>

                  <thead>

                    <tr>

                      <th>
                        Tên sân
                      </th>

                      <th>
                        Loại sân
                      </th>

                      <th>
                        Địa điểm
                      </th>

                      <th>
                        Khung giờ
                      </th>

                      <th>
                        Giá / giờ
                      </th>

                      <th>
                        Trạng thái
                      </th>

                      <th>
                        Thao tác
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      loading
                        ? (

                          <tr>

                            <td
                              colSpan="7"
                              style={{
                                textAlign:
                                  "center"
                              }}
                            >

                              Đang tải...

                            </td>

                          </tr>

                        )

                        : filteredFields.length
                          ===
                          0

                          ? (

                            <tr>

                              <td
                                colSpan="7"
                                style={{
                                  textAlign:
                                    "center"
                                }}
                              >

                                Không có dữ liệu

                              </td>

                            </tr>

                          )

                          : (

                            filteredFields.map(
                              (
                                field,
                                index
                              ) => {

                                const firstRow =
                                  index === 0
                                  ||
                                  filteredFields[
                                    index - 1
                                  ].FieldID
                                  !==
                                  field.FieldID;


                                return (

                                  <tr

                                    key={
                                      field.PriceID
                                        ? `price-${field.PriceID}`
                                        : `field-${field.FieldID}`
                                    }

                                  >

                                    <td>
                                      {
                                        field.FieldName
                                      }
                                    </td>


                                    <td>
                                      {
                                        field.FieldType
                                      }
                                    </td>


                                    <td>
                                      {
                                        field.Location
                                      }
                                    </td>


                                    <td>

                                      {
                                        field.StartTime
                                          ?.slice(
                                            0,
                                            5
                                          )
                                        ||
                                        "--"
                                      }

                                      {" - "}

                                      {
                                        field.EndTime
                                          ?.slice(
                                            0,
                                            5
                                          )
                                        ||
                                        "--"
                                      }

                                    </td>


                                    <td>

                                      <strong>

                                        {
                                          formatPrice(
                                            field.Price
                                          )
                                        }

                                        đ

                                      </strong>

                                    </td>


                                    <td>

                                      <span

                                        className={
                                          field.Status
                                          ===
                                          "AVAILABLE"

                                            ? "status available"

                                            : "status maintenance"
                                        }

                                      >

                                        {
                                          field.Status
                                        }

                                      </span>

                                    </td>


                                    <td>

                                      <div
                                        style={{
                                          display:
                                            "flex",

                                          gap:
                                            "8px",

                                          flexWrap:
                                            "wrap"
                                        }}
                                      >

                                        <button

                                          type="button"

                                          className="edit-btn"

                                          disabled={
                                            !field.PriceID
                                          }

                                          onClick={
                                            () =>
                                              openEdit(
                                                field
                                              )
                                          }

                                        >

                                          Sửa

                                        </button>


                                        {
                                          firstRow
                                          &&
                                          (

                                            <button

                                              type="button"

                                              className="delete-btn"

                                              disabled={
                                                deletingFieldID
                                                ===
                                                field.FieldID
                                              }

                                              onClick={
                                                () =>
                                                  handleDeleteField(
                                                    field
                                                  )
                                              }

                                            >

                                              {
                                                deletingFieldID
                                                ===
                                                field.FieldID

                                                  ? "Đang xóa..."

                                                  : "Xóa sân"
                                              }

                                            </button>

                                          )
                                        }

                                      </div>

                                    </td>

                                  </tr>

                                );
                              }
                            )
                          )
                    }

                  </tbody>

                </table>

              </div>

            </>

          )
        }


        {/* =================================================
            BOOKING MANAGEMENT
        ================================================= */}

        {
          activeSection
          ===
          "bookings"
          &&
          (

            <>

              {/* TITLE */}

              <div
                className="title-row"
              >

                <h1>
                  QUẢN LÝ ĐẶT SÂN
                </h1>


                <button

                  type="button"

                  className="add-btn"

                  disabled={
                    bookingLoading
                  }

                  onClick={
                    () =>
                      loadBookings(
                        user?.UserID
                      )
                  }

                >

                  {
                    bookingLoading
                      ? "Đang tải..."
                      : "↻ Làm mới"
                  }

                </button>

              </div>


              {/* BOOKING STATS */}

              <div
                className="cards"
              >

                <div
                  className="card"
                >

                  <p>
                    Tổng số đơn
                  </p>

                  <h2>
                    {
                      bookingStats.total
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Chờ xác nhận
                  </p>

                  <h2>
                    {
                      bookingStats.pending
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Đã xác nhận
                  </p>

                  <h2>
                    {
                      bookingStats.confirmed
                    }
                  </h2>

                </div>


                <div
                  className="card"
                >

                  <p>
                    Hoàn thành
                  </p>

                  <h2>
                    {
                      bookingStats.completed
                    }
                  </h2>

                </div>

              </div>


              {/* FILTER */}

              <div
                className="filter"
              >

                <input

                  placeholder="🔍 Mã đơn, tên khách hàng, sân, SĐT..."

                  value={
                    bookingSearch
                  }

                  onChange={
                    event =>
                      setBookingSearch(
                        event.target.value
                      )
                  }

                />


                <select

                  value={
                    bookingStatus
                  }

                  onChange={
                    event =>
                      setBookingStatus(
                        event.target.value
                      )
                  }

                >

                  <option value="">
                    Tất cả trạng thái
                  </option>

                  <option value="PENDING">
                    Chờ xác nhận
                  </option>

                  <option value="CONFIRMED">
                    Đã xác nhận
                  </option>

                  <option value="CANCELLED">
                    Đã hủy
                  </option>

                  <option value="COMPLETED">
                    Hoàn thành
                  </option>

                </select>

              </div>


              {/* BOOKING TABLE */}

              <div
                className="table-box"
              >

                <table>

                  <thead>

                    <tr>

                      <th>
                        Mã đơn
                      </th>

                      <th>
                        Khách hàng
                      </th>

                      <th>
                        Sân
                      </th>

                      <th>
                        Ngày
                      </th>

                      <th>
                        Khung giờ
                      </th>

                      <th>
                        Tổng tiền
                      </th>

                      <th>
                        Trạng thái
                      </th>

                      <th>
                        Thao tác
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      bookingLoading
                        ? (

                          <tr>

                            <td
                              colSpan="8"
                              style={{
                                textAlign:
                                  "center"
                              }}
                            >

                              Đang tải danh sách booking...

                            </td>

                          </tr>

                        )

                        : filteredBookings.length
                          ===
                          0

                          ? (

                            <tr>

                              <td
                                colSpan="8"
                                style={{
                                  textAlign:
                                    "center"
                                }}
                              >

                                Không có booking

                              </td>

                            </tr>

                          )

                          : (

                            filteredBookings.map(
                              booking => (

                                <tr
                                  key={
                                    booking.BookingID
                                  }
                                >

                                  <td>

                                    <strong>

                                      #
                                      {
                                        booking.BookingID
                                      }

                                    </strong>

                                  </td>


                                  <td>

                                    <strong>
                                      {
                                        booking.CustomerName
                                        ||
                                        `User #${booking.UserID}`
                                      }
                                    </strong>


                                    {
                                      booking.Phone
                                      &&
                                      (
                                        <>
                                          <br />

                                          <small>
                                            {
                                              booking.Phone
                                            }
                                          </small>
                                        </>
                                      )
                                    }


                                    {
                                      !booking.Phone
                                      &&
                                      booking.Email
                                      &&
                                      (
                                        <>
                                          <br />

                                          <small>
                                            {
                                              booking.Email
                                            }
                                          </small>
                                        </>
                                      )
                                    }

                                  </td>


                                  <td>

                                    {
                                      booking.FieldName
                                    }

                                    {
                                      booking.FieldType
                                      &&
                                      (
                                        <>
                                          <br />

                                          <small>
                                            {
                                              booking.FieldType
                                            }
                                          </small>
                                        </>
                                      )
                                    }

                                  </td>


                                  <td>

                                    {
                                      booking.BookingDate
                                    }

                                  </td>


                                  <td>

                                    {
                                      booking.StartTime
                                    }

                                    {" - "}

                                    {
                                      booking.EndTime
                                    }

                                  </td>


                                  <td>

                                    <strong>

                                      {
                                        formatPrice(
                                          booking.TotalAmount
                                        )
                                      }

                                      đ

                                    </strong>

                                  </td>


                                  <td>

                                    {
                                      renderBookingStatus(
                                        booking.Status
                                      )
                                    }

                                  </td>


                                  <td>

                                    {
                                      renderBookingActions(
                                        booking
                                      )
                                    }

                                  </td>

                                </tr>

                              )
                            )

                          )
                    }

                  </tbody>

                </table>

              </div>

            </>

          )
        }

      </main>


      {/* =====================================================
          ADD FIELD MODAL
      ====================================================== */}

      {
        showAddModal
        &&
        (

          <div
            className="modal"
          >

            <div
              className="modal-content"
            >

              <h2>
                Thêm sân mới
              </h2>


              <label>
                Tên sân
              </label>

              <input

                placeholder="Ví dụ: Sân 3"

                value={
                  newField.FieldName
                }

                onChange={
                  event =>
                    updateNewField(
                      "FieldName",
                      event.target.value
                    )
                }

              />


              <label>
                Loại sân
              </label>

              <select

                value={
                  newField.FieldType
                }

                onChange={
                  event =>
                    updateNewField(
                      "FieldType",
                      event.target.value
                    )
                }

              >

                <option value="5 player">
                  5 player
                </option>

                <option value="7 player">
                  7 player
                </option>

                <option value="11 player">
                  11 player
                </option>

              </select>


              <label>
                Địa điểm
              </label>

              <input

                placeholder="Ví dụ: Hà Nội"

                value={
                  newField.Location
                }

                onChange={
                  event =>
                    updateNewField(
                      "Location",
                      event.target.value
                    )
                }

              />


              <label>
                URL hình ảnh
              </label>

              <input

                placeholder="Không bắt buộc"

                value={
                  newField.Image
                }

                onChange={
                  event =>
                    updateNewField(
                      "Image",
                      event.target.value
                    )
                }

              />


              <label>
                Trạng thái
              </label>

              <select

                value={
                  newField.Status
                }

                onChange={
                  event =>
                    updateNewField(
                      "Status",
                      event.target.value
                    )
                }

              >

                <option value="AVAILABLE">
                  AVAILABLE
                </option>

                <option value="MAINTENANCE">
                  MAINTENANCE
                </option>

              </select>


              <label>
                Giờ bắt đầu
              </label>

              <input

                type="time"

                value={
                  newField.StartTime
                }

                onChange={
                  event =>
                    updateNewField(
                      "StartTime",
                      event.target.value
                    )
                }

              />


              <label>
                Giờ kết thúc
              </label>

              <input

                type="time"

                value={
                  newField.EndTime
                }

                onChange={
                  event =>
                    updateNewField(
                      "EndTime",
                      event.target.value
                    )
                }

              />


              <label>
                Giá / giờ
              </label>

              <input

                type="number"

                min="0"

                step="1000"

                placeholder="Ví dụ: 350000"

                value={
                  newField.Price
                }

                onChange={
                  event =>
                    updateNewField(
                      "Price",
                      event.target.value
                    )
                }

              />


              <button

                type="button"

                className="save-btn"

                disabled={
                  adding
                }

                onClick={
                  handleAddField
                }

              >

                {
                  adding
                    ? "Đang thêm..."
                    : "Thêm sân"
                }

              </button>


              <button

                type="button"

                className="cancel-btn"

                disabled={
                  adding
                }

                onClick={
                  () => {

                    setShowAddModal(
                      false
                    );

                    setNewField(
                      EMPTY_FIELD
                    );

                  }
                }

              >

                Hủy

              </button>

            </div>

          </div>

        )
      }


      {/* =====================================================
          EDIT PRICE MODAL
      ====================================================== */}

      {
        editField
        &&
        (

          <div
            className="modal"
          >

            <div
              className="modal-content"
            >

              <h2>
                Sửa giá sân
              </h2>


              <p>

                <b>
                  {
                    editField.FieldName
                  }
                </b>

              </p>


              <label>
                Giờ bắt đầu
              </label>

              <input

                type="time"

                value={
                  editField.StartTime
                }

                onChange={
                  event =>
                    updateEditField(
                      "StartTime",
                      event.target.value
                    )
                }

              />


              <label>
                Giờ kết thúc
              </label>

              <input

                type="time"

                value={
                  editField.EndTime
                }

                onChange={
                  event =>
                    updateEditField(
                      "EndTime",
                      event.target.value
                    )
                }

              />


              <label>
                Giá tiền
              </label>

              <input

                type="number"

                min="0"

                step="1000"

                value={
                  editField.Price
                  ??
                  ""
                }

                onChange={
                  event =>
                    updateEditField(
                      "Price",
                      event.target.value
                    )
                }

              />


              <button

                type="button"

                className="save-btn"

                disabled={
                  saving
                }

                onClick={
                  handleSaveEdit
                }

              >

                {
                  saving
                    ? "Đang lưu..."
                    : "Lưu thay đổi"
                }

              </button>


              <button

                type="button"

                className="cancel-btn"

                disabled={
                  saving
                }

                onClick={
                  () =>
                    setEditField(
                      null
                    )
                }

              >

                Hủy

              </button>

            </div>

          </div>

        )
      }

    </div>
  );
}


export default Admin;