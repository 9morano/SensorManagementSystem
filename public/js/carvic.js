////////////////////////////////////////////////////////////////////

var Carvic = {
    Model: {
        HasErrors: ko.observable(""),
        ErrorMsg: ko.observable("")
    }
};
var now = new Date();

////////////////////////////////////////////////////////////////////

Carvic.Model.StdData = function () {
    var self = this;
    self.Error = ko.observable("");
    self.HasErrors = ko.observable(false);
    self.CurrentUserFullname = ko.observable("");
    self.CurrentUsername = ko.observable("");
    self.CurrentUserTooltip = ko.computed(function () {
        return "Logged in: " + self.CurrentUserFullname() + " (" + self.CurrentUsername() + ")"; ateen
    }, self);
    self.CurrentUserPage = function () {
        window.location = "user.html?u=" + self.CurrentUsername();
    };
    self.CurrentUserType = ko.observable("normal");
    self.CurrentUserIsAdmin = ko.observable(false);
    self.CurrentUserToken = ko.observable("");
};

////////////////////////////////////////////////////////////////////

Carvic.Utils = {

    CheckIfEmpty: function (obj, err_msg, errors) {
        if (!obj || obj === "") {
            errors.push(err_msg);
        }
    },

    AddAdminLinks: function () {
        $("#navRight").append('<li><a href="rundeck.html"><i class="glyphicon glyphicon-wrench"></i></i> Manage</a></li>');
        $("#navRight").append('<li><a href="jenkins.html"><i class="glyphicon glyphicon-refresh"></i></i> CI</a></li>');
        $("#navRight").append('<li><a href="users.html"><i class="glyphicon glyphicon-user"></i> Users</a></li>');
        $("#navRight").append('<li><a href="controller.html"><i class="glyphicon glyphicon-user"></i> Experiment controller</a></li>');
    },

    LoadClusterList: function (receiver, callback) {
        var query = {};
        Carvic.Utils.Post({ action: "get_clusters", data: query }, function (data) {
            Carvic.Utils.ClusterLookupCache = []
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                receiver.push({ code: obj.id, title: obj.name });
                Carvic.Utils.ClusterLookupCache.push(obj.name);
            }
            if (callback) callback();
        });
    },

    LoadUserList: function (receiver) {
        var query = {};
        Carvic.Utils.Post({ action: "get_users", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                receiver.push({ code: obj.username, title: obj.full_name });
            }
        });
    },

    ConnectInputWithDesc: function (selector) {
        $(selector).on('focus', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $collapse = $this.next();
            $collapse.collapse('toggle');
        });
        $(selector).on('blur', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $collapse = $this.next();
            $collapse.collapse('toggle');
        });
    },

    ClusterLookupCache: null,
    ClusterLookup: function (s, callback) {
        if (Carvic.Utils.ClusterLookupCache != null) {
            callback(Carvic.Utils.ClusterLookupCache);
        } else {
            var req = {
                action: "cluster_list",
                data: {}
            };
            Carvic.Utils.Post(req, function (data) {
                Carvic.Utils.ClusterLookupCache = data;
                callback(Carvic.Utils.ClusterLookupCache);
            });
        }
    },

    ComponentLookup: function (s, callback) {
        var req = {
            action: "lookup_component",
            data: { search_str: s }
        };
        Carvic.Utils.Post(req, function (data) {
            callback(data);
        });
    },

    Logout: function () {
        var url = "" + document.location;
        document.location = "/logout";
    },

    SetCurrentUser: function (parent, callback) {
        parent.StdData = new Carvic.Model.StdData();
        var req = {
            action: "get_current_user",
            data: {}
        };
        Carvic.Utils.Post(req, function (data) {
            parent.StdData.CurrentUserFullname(data.full_name);
            parent.StdData.CurrentUsername(data.username);
            parent.StdData.CurrentUserType(data.type);
            parent.StdData.CurrentUserIsAdmin((data.type == "admin"));
            if (data.type == "admin") {
                Carvic.Utils.AddAdminLinks();
            }
            parent.StdData.CurrentUserToken(data.token);
            if (callback)
                callback();
        });
    },

    ParseDate: function (s, default_value) {
        default_value = default_value || null;
        var parts = s.split(".");
        if (parts.length != 3)
            return default_value;
        var y = Number(parts[2]);
        var m = Number(parts[1]);
        var d = Number(parts[0]);
        if (y === NaN || m === NaN || d === NaN)
            return default_value;
        return new Date(y, m - 1, d);
    },

    GetDatePart: function (d) {
        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();
        return new Date(curr_year, curr_month, curr_date);
    },

    FormatDate: function (d) {
        if (d === undefined || !d) return "";
        var curr_date = d.getDate();
        var curr_month = d.getMonth() + 1;
        var curr_year = d.getFullYear();
        return Carvic.Utils.Pad(curr_date, 2) + "." + Carvic.Utils.Pad(curr_month, 2) + "." + curr_year;
    },

    FormatDateTime: function (d) {
        if (d === undefined || !d) return "";
        var curr_hour = d.getHours();
        var curr_minute = d.getMinutes();
        var curr_second = d.getSeconds();
        return Carvic.Utils.FormatDate(d) + " " + curr_hour + ":" + Carvic.Utils.Pad(curr_minute, 2) + ":" + Carvic.Utils.Pad(curr_second, 2);
    },

    FormatDateTime2: function (d) {
        if (d === undefined || !d) return "";
        var curr_hour = d.getHours();
        var curr_minute = d.getMinutes();
        return Carvic.Utils.FormatDate(d) + " " + curr_hour + ":" + Carvic.Utils.Pad(curr_minute, 2);
    },

    FormatMoney: function (amt) {
        var decPlaces = 2;
        var thouSeparator = ".";
        var decSeparator = ",";
        var n = amt;
        var decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
        var decSeparator = decSeparator == undefined ? "." : decSeparator;
        var thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
        var sign = n < 0 ? "-" : "";
        var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
        var j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    },

    CreateMap: function (array, id_member) {
        var res = {};
        for (var i in array) {
            var obj = array[i];
            res[obj[id_member]] = obj;
        }
        return res;
    },

    CheckMatch: function (rec, query) {
        var ok = true;
        for (var f in query) {
            if (rec[f] !== query[f]) {
                ok = false;
                break;
            }
        }
        return ok;
    },

    GetMatches: function (query, array) {
        var res = [];
        for (var i in array) {
            var obj = array[i];
            if (Carvic.Utils.CheckMatch(obj, query)) {
                res.push(obj);
            }
        }
        return res;
    },

    Post: function (obj, callback, error_callback) {
        $.ajax({
            type: 'POST',
            url: '/handler',
            data: JSON.stringify(obj),
            contentType: "application/json; charset=utf-8",
            success: function (result) {
                var result_data = {};
				if (result && result != "") {
					result_data = JSON.parse(result);
				}
                if (result_data.error == null) {
                    Carvic.Model.HasErrors(false);
                    callback(result_data);
                } else {
                    Carvic.Model.ErrorMsg(result_data.error.message);
                    Carvic.Model.HasErrors(true);
                    if (error_callback) {
                        error_callback(Carvic.Model.ErrorMsg());
                    } else {
                        alert(Carvic.Model.ErrorMsg());
                    }
                }
            },
            error: function (obj, status, err) {
                Carvic.Model.HasErrors(true);
                Carvic.Model.ErrorMsg("" + (err || status));
                if (error_callback) {
                    error_callback(Carvic.Model.ErrorMsg());
                } else {
                    alert(Carvic.Model.ErrorMsg());
                }
            },
            dataType: "text",
            processData: false
        });
    },

    GetUrlParam: function (name) {
        var regularExp = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var searchResults = regularExp.exec(window.location.href);
        if (searchResults != null) return searchResults[1];
        return null;
    },

    // prefix int with leading zeros
    Pad: function (num, size) {
        return ('0000000000000000000' + num).substr(-size);
    }
};

////////////////////////////////////////////////////////////////////
// Model for user list

Carvic.Model.UsersModel = function () {

    var self = this;

    self.UserList = ko.observableArray();
    self.ResultCount = ko.computed(function () {
        return (self.UserList() == undefined ? 0 : self.UserList().length);
    }, self);

    self.NewUserUsername = ko.observable("new1");
    self.NewUserFullName = ko.observable("new user");
    self.NewUserPwd1 = ko.observable("");
    self.NewUserPwd2 = ko.observable("");
    self.NewUserType = ko.observable();

    //self.UserTypesArray = Carvic.Consts.UserTypesArray;
    self.UserTypes = ko.observableArray();
    self.UserTypesMap = {};

    self.NewUserType(self.UserTypes()[1]);

    //self.UserStatusesArray = Carvic.Consts.UserStatusesArray;
    self.UserStatuses = ko.observableArray();
    self.UserStatusesMap = {};

    self.NewUserEditing = ko.observable(false);
    self.NewUserEdit = ko.observable({
        FullName: ko.observable(""),
        Status: ko.observable(""),
        Type: ko.observable("")
    });

    self.NewUserStartEditing = function () {
        self.NewUserEditing(true);
    }
    self.NewUserCancelEditing = function () {
        document.form.NewUserPwd1.value = "";
        document.form.NewUserPwd2.value = "";
        document.form.NewUserFullName.value = "new user";
        document.form.NewUserUsername.value = "New1";
        self.NewUserEditing(false);
    }

    self.getUserTypes = function (callback) {
        var d = {}
        self.UserTypes.removeAll();
        self.UserTypesMap = {};
        Carvic.Utils.Post({ action: "get_all_user_types", data: d }, function (data) {
            data.forEach( function (item){
                self.UserTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.UserTypesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.getUserStatuses = function (callback) {
        self.UserStatuses.removeAll();
        self.UserStatusesMap = {};
        var d = {}
        Carvic.Utils.Post({ action: "get_all_user_statuses", data: d }, function (data) {
            data.forEach( function (item) {
                self.UserStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.UserStatusesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.LoadUsers = function () {
        self.UserList.removeAll();
        var query = {};
        Carvic.Utils.Post({ action: "get_users", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.UserList.push({
                    Username: obj.username,
                    FullName: obj.full_name,
                    Status: obj.status,
                    Type: obj.type,
                    LastLogin: new Date(Date.parse(obj.last_login)),
                    LastBadLogin: new Date(Date.parse(obj.last_bad_login)),
                    BadLoginCount: obj.bad_login_cnt
                });
            }
        });
    };

    self.ShowUserDetails = function (curr_user) {
        window.location = "user.html?u=" + curr_user.Username;
    };

    self.SaveNewUser = function () {
        var req = {
            action: "new_user",
            data: {
                username: self.NewUserUsername(),
                full_name: self.NewUserFullName(),
                type: self.NewUserType().code,
                pwd1: self.NewUserPwd1(),
                pwd2: self.NewUserPwd2()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            self.ShowUserDetails({ Username: req.data.username });
        });
    };
    self.getUserTypes( function() {
        self.getUserStatuses ( function() {
            self.LoadUsers();
        });
    });
};

////////////////////////////////////////////////////////////////////
// Model for user details

Carvic.Model.UserModel = function () {

    var self = this;

    self.ShowLogins = ko.observable(false);
    self.ShowChanges = ko.observable(true);
    self.CurrentUser = ko.observable({
        Username: ko.observable(""),
        FullName: ko.observable(""),
        StatusStr: ko.observable(""),
        Status: ko.observable(""),
        TypeStr: ko.observable(""),
        Type: ko.observable(""),
        APIToken: ko.observable(""),
        LastLogin: (new Date()),
        LastBadLogin: (new Date()),
        BadLoginCount: 0,
        LoginHistory: [],
        History: []
    });

    self.CurrentUserBackup = {};

    self.Enabled = ko.observable(false);
    self.Server = ko.observable("");
    self.Port = ko.observable("");
    self.PathAfterSensorScan = ko.observable("");
    self.PathAfterNodeChange = ko.observable("");
    self.PathAfterSensorChange = ko.observable("");
    self.AfterNodeChange = ko.observable(false);
    self.AfterSensorScan = ko.observable(false);
    self.AfterSensorChange = ko.observable(false);

    self.EditUserPwd1 = ko.observable("");
    self.EditUserPwd2 = ko.observable("");

    //self.UserTypesArray = Carvic.Consts.UserTypesArray;
    self.UserTypes = ko.observableArray();
    self.UserTypesMap = {};

    //self.UserStatusesArray = Carvic.Consts.UserStatusesArray;
    self.UserStatuses = ko.observableArray();
    self.UserStatusesMap = {};

    self.CurrentUserEditing = ko.observable(false);
    self.CurrentUserEditingPwd = ko.observable(false);
    self.CurrentUserEdit = ko.observable({
        FullName: ko.observable(""),
        Status: ko.observable(""),
        Type: ko.observable("")
    });

    self.ChangeNotify = function () {
        var query = {
            enabled: self.Enabled(),
            server: self.Server(),
            port: self.Port(),
            path_after_sensor_scan: self.PathAfterSensorScan(),
            path_after_node_change: self.PathAfterNodeChange(),
            path_after_sensor_change: self.PathAfterSensorChange(),
            after_node_change: self.AfterNodeChange(),
            after_sensor_scan: self.AfterSensorScan(),
            after_sensor_change: self.AfterSensorChange()
        };
        Carvic.Utils.Post({ action: "change_notify", data: query }, function (data) {
            alert("Notify changed successfully");
        });

    };

    self.Load = function (username) {
        var query = { username: username };
        Carvic.Utils.Post({ action: "get_notify", data: query }, function (data) {
            var obj = data;
            self.Enabled(obj.enabled);
            self.Server(obj.server);
            self.Port(obj.port);
            self.PathAfterSensorScan(obj.path_after_sensor_scan);
            self.PathAfterNodeChange(obj.path_after_node_change);
            self.PathAfterSensorChange(obj.path_after_sensor_change);
            self.AfterNodeChange(obj.after_node_change);
            self.AfterSensorScan(obj.after_sensor_scan);
            self.AfterSensorChange(obj.after_sensor_change);
        });
    };

    self.getUserTypes = function (callback) {
        var d = {}
        self.UserTypes.removeAll();
        self.UserTypesMap = {};
        Carvic.Utils.Post({ action: "get_all_user_types", data: d }, function (data) {
            data.forEach( function (item){
                self.UserTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.UserTypesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.getUserStatuses = function (callback) {
        self.UserStatuses.removeAll();
        self.UserStatusesMap = {};
        var d = {}
        Carvic.Utils.Post({ action: "get_all_user_statuses", data: d }, function (data) {
            data.forEach( function (item) {
                self.UserStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.UserStatusesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.CurrentUserStartEditing = function () {
        self.CurrentUserEdit().FullName(self.CurrentUser().FullName());
        self.CurrentUserEdit().Status(Carvic.Utils.GetMatches({ code: self.CurrentUser().Status() }, self.UserStatuses())[0]);
        self.CurrentUserEdit().Type(Carvic.Utils.GetMatches({ code: self.CurrentUser().Type() }, self.UserTypes())[0]);
        self.CurrentUserEditing(true);
    }
    self.CurrentUserStartEditingPwd = function () {
        self.CurrentUserEditingPwd(true);
    }

    self.CurrentUserChangePwd = function () {
        var query = {
            username: self.CurrentUser().Username(),
            pwd1: self.EditUserPwd1(),
            pwd2: self.EditUserPwd2()
        };
        Carvic.Utils.Post({ action: "change_pwd", data: query }, function (data) {
            alert("Password changed successfully");
            document.form.EditPwd1.value = "";
            document.form.EditPwd2.value = "";
            self.CurrentUserEditingPwd(false);
        });
    }

    self.CurrentUserSave = function () {
        if(!/^[0-9]*$/.test(self.Port())) {
            alert("Only numbers in port section");
            return;
        }
        if(self.Port() < 0 || self.Port() > 65535) {
            alert("Port number must be between 0 and 65535");
            return;
        }
        var query = {
            username: self.CurrentUser().Username(),
            enabled: self.Enabled(),
            server: self.Server(),
            port: self.Port(),
            path_after_sensor_scan: self.PathAfterSensorScan(),
            path_after_node_change: self.PathAfterNodeChange(),
            path_after_sensor_change: self.PathAfterSensorChange(),
            after_node_change: self.AfterNodeChange(),
            after_sensor_scan: self.AfterSensorScan(),
            after_sensor_change: self.AfterSensorChange()
        };
        Carvic.Utils.Post({ action: "change_notify", data: query }, function (data) {
        });

        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.CurrentUserEdit().FullName(), "Full name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot save user:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var req = {
            action: "update_user",
            data: { username: self.CurrentUser().Username() }
        };
        if (self.CurrentUserEdit().FullName() !== self.CurrentUser().FullName())
            req.data.full_name = self.CurrentUserEdit().FullName();
        if (self.CurrentUserEdit().Status().code !== self.CurrentUser().Status())
            req.data.status = self.CurrentUserEdit().Status().code;
        if (self.CurrentUserEdit().Type().code !== self.CurrentUser().Type())
            req.data.type = self.CurrentUserEdit().Type().code;

        Carvic.Utils.Post(req, function (data) {
            self.CurrentUserEditing(false);
            self.LoadUser(self.CurrentUser().Username());
        });
    }
    self.CurrentUserCancelEditing = function () {
        self.CurrentUserEditing(false);
    }
    self.CurrentUserCancelEditingPwd = function () {
        document.form.EditPwd1.value = "";
        document.form.EditPwd2.value = "";
        self.CurrentUserEditingPwd(false);
    }

    self.LoadUser = function (id) {
        Carvic.Utils.Post({ action: "get_user", data: { username: id} }, function (data) {
            self.CurrentUser({
                Username: ko.observable(data.username),
                FullName: ko.observable(data.full_name),
                StatusStr: ko.observable(self.UserStatusesMap[data.status].title),
                Status: ko.observable(data.status),
                TypeStr: ko.observable(self.UserTypesMap[data.type].title),
                Type: ko.observable(data.type),
                APIToken: ko.observable(data.token),
                LastLogin: new Date(Date.parse(data.last_login)),
                LastBadLogin: new Date(Date.parse(data.last_bad_login)),
                BadLoginCount: data.bad_login_cnt,
                LoginHistory: ko.observableArray(),
                History: ko.observableArray()
            });
            self.DoShowChanges();
        });
    };

    self.LoadLoginHistory = function () {
        if (self.CurrentUser().LoginHistory().length > 0)
            return;
        self.CurrentUser().LoginHistory.removeAll();
        var req = {
            action: "get_logins",
            data: {
                username: self.CurrentUser().Username()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.CurrentUser().LoginHistory.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Ip: obj.ip,
                    LastAction: new Date(Date.parse(obj.last_action))
                }));
            }
             //it starts from the page 1
            //30 elements per page
            paginate(0, 30);

            $('#page-selection-userLogins').bootpag({

                total: paginate(0, 30),
                page: 1,
                maxVisible: 3,
                leaps: true,
                firstLastUse: true,
                first: 'First',
                last: 'Last',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                //$('.history_border').html(); // or some ajax content loading...
                paginate(num - 1, 30);

            });
        });
    };

    self.LoadUserHistory = function () {
        if (self.CurrentUser().History().length > 0)
            return;
        self.CurrentUser().History.removeAll();
        var req = {
            action: "get_user_history",
            data: {
                username: self.CurrentUser().Username()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.CurrentUser().History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    Node: obj.node,
                    Css: (obj.code === "node_change" ? "icon-edit" : "icon-check")
                }));
            }
             //it starts from the page 1
            //ten elements per page
            paginate(0, 10);

            $('#page-selection-userChanges').bootpag({

                total: paginate(0, 10),
                page: 1,
                maxVisible: 3,
                leaps: true,
                firstLastUse: true,
                first: 'First',
                last: 'Last',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                //$('.history_border').html(); // or some ajax content loading...
                paginate(num - 1, 10);

            });
        });
    };

    self.CloseUserDetails = function () {
        window.location = "users.html";
    };

    self.DisableUser = function () {
        self.CurrentUser().Status("inactive");
    };

    self.EnableUser = function () {
        self.CurrentUser().Status("active");
    };

    self.DeleteUser = function () {
        if (confirm("Are you sure that you want to delete this user?")) {
            var req = {
                action: "delete_user",
                data: { username: self.CurrentUser().Username() }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("User successfully deleted.");
                self.CloseUserDetails();
            });
        }
    };

    self.RegenerateToken = function () {
        if (confirm("This user's token might be hard coded into an application. Regenerating it will block the application's access to SMS API. \nAre you sure you want to regenerate token for this user?")) {
            var req = {
                action: "regenerate_token",
                data: { username: self.CurrentUser().Username() }
            };

            Carvic.Utils.Post(req, function (data) {
                alert("Token successfully regenerated.");
                self.LoadUser(self.CurrentUser().Username());
            });
        }
    };

    self.DoShowLogins = function () {
        self.LoadLoginHistory();
        self.ShowLogins(true);
        self.ShowChanges(false);
    };

    self.DoShowChanges = function () {
        self.LoadUserHistory();
        self.ShowLogins(false);
        self.ShowChanges(true);
    }
    self.getUserTypes( function() {
        self.Load(Carvic.Utils.GetUrlParam("u"));
        self.getUserStatuses( function() {
            var id = Carvic.Utils.GetUrlParam("u");
            if (id)
                Carvic.Model.User.LoadUser(id);
            else
                Carvic.Model.User.LoadUser(5);
        });
    })
};

////////////////////////////////////////////////////////////////////
// Model for node search and details

Carvic.Model.NodesModel = function (callback) {

    var self = this;

    self.SearchResult = ko.observableArray();
    self.CheckedNodes = ko.observableArray();
    self.AdvancedSearch = ko.observable(false);
    self.MyMap = ko.observable(false);
    self.NodeSearchName = ko.observable("");
    self.NodeSearchId = ko.observable("");
    self.NodeSearchMachineId = ko.observable("");
    self.NodeSearchCluster = ko.observable();
    self.NodeSearchClusterList = ko.observableArray();
    self.NodeSearchStatus = ko.observable("");
    self.NodeSearchStatusList = ko.observableArray();
    self.NodeStatuses = ko.observableArray();
    self.NodeStatusesMap = {};

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.RecCount = ko.observable(0);

    self.getNodeStatuses = function (callback) {
        var d = {}
        self.NodeStatuses.removeAll();
        self.NodeStatusesMap = {};
        Carvic.Utils.Post({ action: "get_all_node_statuses", data: d }, function (data) {
            data.forEach( function (item){
                self.NodeStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.NodeStatusesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }
    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }

    // load cluster list
    Carvic.Utils.LoadClusterList(self.NodeSearchClusterList, callback);

    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.DoAdvancedSearch = function () {
        self.AdvancedSearch(true);
    };

    self.DoShowMyMap = function () {
        self.MyMap(true);
        if (self.SearchResult().length > 0) {
            self.InitMap();
        }
    };

    self.InitMap = function () {
        var map = new google.maps.Map(document.getElementById("map"), {
            zoom: 19,
            center: new google.maps.LatLng(46.042376, 14.488229)
        });

        for (var i = 0; i < self.SearchResult().length; i++) {
            var node = self.SearchResult()[i]();
            var status = node.Status();
            var desc = '<h4><a href="node.html?id=' + encodeURI(node.ID) + '">' + node.Name + "</a></h4>"
            desc = desc + "<p>" + JSON.stringify(node.Extra).split(",").join(",<br/>") + "</p>";
            if (status == "active") {
                var icon = "img/green-dot.png";
            } else if (status == "inactive") {
                var icon = "img/yellow-dot.png";
            } else {
                var icon = "img/red-dot.png";
            }
            var infowindow = new google.maps.InfoWindow({
                content: desc
            });
            var marker = new google.maps.Marker({
            position: {lat: node.LAT, lng: node.LON},
            icon: icon,
            map: map,
            title: node.Name
          });
          google.maps.event.addListener(marker,'click', (function(marker,desc,infowindow) {
              return function() {
                  infowindow.setContent(desc);
                  infowindow.open(map,marker);
              };
          })(marker,desc,infowindow));
        }
    }

    self.Search = function () {
        self.MyMap(false);
        self.SearchInner(true);
    }

    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();
        self.CheckedNodes.removeAll();

        var query = { page: self.CurrPage() };
        if (self.NodeSearchId() != "") { query.id = self.NodeSearchId().trim(); }
        if (self.NodeSearchName() != "") { query.name = self.NodeSearchName().trim(); }

        if (self.NodeSearchCluster() != "") {
            var s = self.NodeSearchCluster();
            $.each(
                self.NodeSearchClusterList(),
                function (index, val) {
                if (val.title == s)
                query.cluster = val.code; }
            );
        }

        if (self.NodeSearchStatus() != "") { query.status = self.NodeSearchStatus(); }

        if (self.NodeSearchMachineId() != "") { query.machine_id = self.NodeSearchMachineId().trim(); }

        self.sortFunction = function(a, b) {
            return a().ID > b().ID ? 1 : -1;
        };

        Carvic.Utils.Post({ action: "get_nodes2", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();

            for (var i = 0; i < data.records.length; i++) {
                let obj = data.records[i];
                let sensors = [];
                Carvic.Utils.Post({ action: "get_sensors_for_node2", data: obj._id}, function (sensor_data) {
                    sensor_data.forEach(function (item) {
                        sensors.push(item.quantity);
                    });
                    self.SearchResult.push(ko.observable({
                        ID: obj.id,
                        Name: obj.name,
                        Status: ko.observable(obj.status),
                        StatusStr: ko.observable(self.NodeStatusesMap[obj.status].title),
                        Cluster: obj.cluster,
                        ClusterName: obj.cluster_name,
                        LON: obj.loc_lon,
                        LAT: obj.loc_lat,
                        MachineId: obj.machine_id,
                        Extra: obj.extra_fields,
                        Sensors: sensors.join(", ")
                    }));
                });
            }
        });
    };

    self.DeleteNodeList = function () {
        switch (self.CheckedNodes().length > 0) {
            case false:
                alert("There are no nodes chosen to delete!");
                break;
            default:
                if (confirm("You are about to delete:\n" + self.CheckedNodes() + "\n" + "\n" + "Are you sure you want to delete these nodes?")) {
                    for (i in self.CheckedNodes()) {
                        var req = {
                            action: "delete_node",
                            data: { id: self.CheckedNodes()[i] }
                        };
                        Carvic.Utils.Post(req, function (data) {
                            self.CheckedNodes.removeAll();
                            self.SearchResult.removeAll();
                            self.Search();
                       });
                    }
                }
                break;
        }
    };

    self.ToggleAll = function () {
        self.CheckedNodes.removeAll();
            for(i = 0; i < self.SearchResult().length; i++) {
                self.CheckedNodes().push(self.SearchResult()[i]().ID);
            }
        return self.CheckedNodes();
    };

    self.SelectAll = ko.dependentObservable({
        read: function() {
            return self.CheckedNodes().length === self.SearchResult().length;
        },
        write: function() {
            self.CheckedNodes(self.CheckedNodes().length === self.SearchResult().length ? [] : self.ToggleAll());
        },
        owner: self
    });

    self.ShowNodeDetails = function (curr_node) {
        window.location = "node.html?id=" + encodeURI(encodeURI(curr_node.ID));
    };

    self.OpenNewNode = function (curr_node) {
        window.location = "new_node.html";
    };

    self.getNodeStatuses( function() {
        self.Search();
    });
}

////////////////////////////////////////////////////////////////////
// Model for single node search and details

Carvic.Model.SingleNodeModel = function () {

    var self = this;

    self.CurrentNodeEditing = ko.observable(false);

    self.NodeClusterList = ko.observableArray();
    Carvic.Utils.LoadClusterList(self.NodeClusterList);

    //self.NodeStatusesArray = Carvic.Consts.NodeStatusesArray;
    self.NodeStatuses = ko.observableArray();
    self.NodeStatusesMap = {};

    //self.NodeRolesArray = Carvic.Consts.NodeRolesArray;
    self.NodeRoles = ko.observableArray();
    self.NodeRolesMap = {};

    self.NodeID = ko.observable("");
    self.Node_ID = ko.observable("");
    self.NodeName = ko.observable("");
    self.NodeStatus = ko.observable("unknown");
    self.NodeStatusStr = ko.computed(function () {
        return (typeof(self.NodeStatusesMap[self.NodeStatus()]) === "undefined") ? self.NodeStatus() :  self.NodeStatusesMap[self.NodeStatus()].title;
    }, this);
    self.NodeCluster = ko.observable();
    self.NodeClusterName = ko.observable();
    self.NodeClusterUrl = ko.observable();
    self.NodeLON = ko.observable("");
    self.NodeLAT = ko.observable("");
    self.NodeMachineId = ko.observable("");
    self.NodeMapUrl = ko.observable("");

    self.Sensors = ko.observableArray();
    self.Components = ko.observableArray();
    self.NodeExtraFields = ko.observableArray();
    self.ComponentsError = ko.observable(false);
    self.NodeHistory = ko.observableArray();
    self.OriginalData = {};

    self.CurrentSensor = ko.observable();
    self.ShowHistory = ko.observable(false);
    self.ShowSensorHistory = ko.observable(false);
    self.ShowSensorList = ko.observable(false);
    self.ShowNodeData = ko.observable(true);
    self.ShowRawSensorData = ko.observable(true);
    self.ShowSensorChart = ko.observable(false);
    self.ShowDownloadSensorData = ko.observable(false);
    self.NodeEditComponentToAdd = ko.observable();
    self.NodeEditFieldToAdd = ko.observable("");

    Chart.defaults.global.responsive = true;
    Chart.defaults.global.animation = false;

    self.getNodeStatuses = function (callback) {
        var d = {}
        self.NodeStatuses.removeAll();
        self.NodeStatusesMap = {};
        Carvic.Utils.Post({ action: "get_all_node_statuses", data: d }, function (data) {
            data.forEach( function (item){
                self.NodeStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.NodeStatusesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.getNodeRoles = function (callback) {
        var d = {}
        self.NodeRoles.removeAll();
        self.NodeRolesMap = {};
        Carvic.Utils.Post({ action: "get_all_node_roles", data: d }, function (data) {
            data.forEach( function (item){
                self.NodeRoles.push({
                    title: item.title,
                    code: item.code
                });
                self.NodeRolesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.LoadDataFromObject = function (data) {
        self.NodeID(data.id);
        self.Node_ID(data._id);
        self.NodeName(data.name);
        self.NodeStatus(data.status);
        self.NodeCluster(data.cluster);
        self.NodeClusterName(data.cluster_name);
        self.NodeClusterUrl("cluster.html?id=" + encodeURI(data.cluster));
        self.NodeLON(data.loc_lon);
        self.NodeLAT(data.loc_lat);
        self.NodeMachineId(data.machine_id);
        self.NodeMapUrl("map.html?type=node&lat=" + encodeURI(data.loc_lat) + "&lon=" + encodeURI(data.loc_lon) + "&id=" + encodeURI(data.id) + "&status=" + encodeURI(data.status));
        var sensors = data.sensors;

        self.Components.removeAll();
        for (var c in data.components) {
            var cid = data.components[c];
            self.AddNewComponentId(cid);
        }

        self.NodeExtraFields.removeAll();
        for (var c in data.extra_fields) {
            var cid = data.extra_fields[c];
            self.AddFieldId(cid);
        }

        Carvic.Utils.Post({ action: "get_sensors_for_node", data: { node: data.id} }, function (data) {
            self.Sensors.removeAll();
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                var obj2 = new Carvic.Model.NodeSensorModel(obj, self);
                self.Sensors.push(ko.observable(obj2));
                if (i == 0) {
                    self.DoShowSensor(obj2.ID);
                }
            }
        });

        self.ComponentsError(false);
        Carvic.Utils.Post({ action: "get_nodes_with_same_components", data: { node: data.id} }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                for (var j = 0; j < self.Components().length; j++) {
                    var comp = self.Components()[j];
                    console.log(comp.Id(), obj.id, comp.Id() == obj.id);
                    if (comp.Id() == obj.id) {
                        comp.OtherNodesCount(obj.other_nodes_cnt);
                        if (obj.other_nodes_cnt > 0)
                            self.ComponentsError(true);
                        continue;
                    }
                }
            }
        });
    };

    self.LoadNode = function (id) {
        Carvic.Utils.Post({ action: "get_node", data: { id: id} }, function (data) {
            self.OriginalData = data;
            self.LoadDataFromObject(data);
        });
    };

    self.RemoveComponent = function (id) {
        self.Components.remove(function (item) {
            return item.Id() == id;
        });
    };
    self.AddNewComponentId = function (id) {
        var obj = {
            Id: ko.observable(id),
            OtherNodesCount: ko.observable(0),
            Url: ko.observable("component.html?id=" + encodeURI(id)),
            RemoveThisComponent: function () { self.RemoveComponent(this.Id()); }
        };
        self.Components.push(obj);
        return obj;
    }
    self.AddNewComponent = function () {
        var id = self.NodeEditComponentToAdd();
        if (id.length > 0) {
            var obj = self.AddNewComponentId(id);

            var req = { action: "check_component_for_multiple_nodes", data: { component: id} };
            Carvic.Utils.Post(req, function (data) {
                if (data.length > 0) {
                    obj.OtherNodesCount(data.length);
                }
            });

            self.NodeEditComponentToAdd("");
        }
    }

    self.RemoveField = function (id) {
        self.NodeExtraFields.remove(function (item) {
            return item.Id() == id;
        });
    };
    self.AddFieldId = function (id) {
        var obj = {
            Id: ko.observable(Object.keys(id)),
            Value: ko.observable(id[Object.keys(id)]),
            OtherNodesCount: ko.observable(0),
            RemoveThisField: function () { self.RemoveField(this.Id()); }
        };
        self.NodeExtraFields.push(obj);
        return obj;
    }
    self.AddNewFieldId = function (id) {
        var obj = {
            Id: ko.observable(id),
            Value: ko.observable(),
            OtherNodesCount: ko.observable(0),
            RemoveThisField: function () { self.RemoveField(this.Id()); }
        };
        self.NodeExtraFields.push(obj);
        return obj;
    }
    self.AddNewField = function () {
        var id = self.NodeEditFieldToAdd();
        if (id.length > 0) {
            var obj = self.AddNewFieldId(id);
            self.NodeEditFieldToAdd("");
        }
    }

    self.DeleteNode = function () {
        if (confirm("Are you sure you want to delete this node? It cannot be undone.")) {
            var req = {
                action: "delete_node",
                data: {
                    id: self.NodeID()
                }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("Node deleted successfully.");
                document.location = "nodes.html";
            });
        }
    }
    self.StartEditNode = function () {
        self.CurrentNodeEditing(true);
    };
    self.EndEditNode = function () {

        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NodeName(), "Name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot update  node:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var components = [];
        var error_nodes = 0;
        self.Components().forEach(function (item) {
            error_nodes += item.OtherNodesCount();
            components.push(item.Id());
        });
        if (error_nodes > 0) {
            alert("Some components are already associated with other nodes. Please resolve the conflict.");
            return;
        }

        var extraFields = [];
        self.NodeExtraFields().forEach(function (item) {
          var field = {};
          field[item.Id()] = item.Value();
          extraFields.push(field);
        });

        self.CurrentNodeEditing(false);
        var req = {
            action: "update_node",
            data: {
                id: self.NodeID(),
                name: self.NodeName(),
                status: self.NodeStatus(),
                cluster: self.NodeCluster(),
                loc_lon: parseFloat(self.NodeLON()),
                loc_lat: parseFloat(self.NodeLAT()),
                machine_id: self.NodeMachineId(),
                extra_fields: extraFields,
                components: components
            }
        };
        Carvic.Utils.Post(req, function (data) {
            self.LoadNode(req.data.id);
            self.NodeHistory.removeAll();
            self.LoadNodeHistory();
        });
    };
    self.CancelEditNode = function () {
        self.LoadDataFromObject(self.OriginalData);
        self.CurrentNodeEditing(false);
    };

    self.ShowNodeDetails = function (curr_node) {
        window.location = "node.html?id=" + encodeURI(curr_node.ID);
    };

    self.CloseNodeDetails = function () {
        window.location = "nodes.html";
    };

    self.LoadNodeHistory = function () {
        if (self.NodeHistory().length > 0)
            return;
        self.NodeHistory.removeAll();
        var req = {
            action: "get_node_history",
            data: {
                id: self.NodeID()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.NodeHistory.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "node_change" ? "icon-edit" : "icon-check")
                }));
            }
            //it starts from the page 1
            //ten elements per page
            paginate(0, 10);

            $('#page-selection-nodeHistory').bootpag({

                total: paginate(0, 10),
                page: 1,
                maxVisible: 3,
                leaps: true,
                firstLastUse: true,
                first: 'First',
                last: 'Last',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                //$('.history_border').html(); // or some ajax content loading...
                paginate(num - 1, 10);

            });
        });
    };

    self.DoShowHistory = function () {
        self.LoadNodeHistory(false);
        self.ShowHistory(true);
        self.ShowSensorHistory(false);
        self.ShowSensorList(false);
        self.ShowNodeData(false);
    };

    self.DoShowSensors = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(true);
        self.ShowSensorList(false);
        self.ShowNodeData(false);
    };

    self.DoShowSensor = function (id) {
        for (var i = 0; i < self.Sensors().length; i++) {
            var sensor = self.Sensors()[i]();
            if (sensor.ID === id) {
                if (self.CurrentSensor() != null) {
                    self.CurrentSensor().IsActive(false);
                }
                self.CurrentSensor(sensor);
                self.CurrentSensor().IsActive(true);
                self.DoShowRawSensorData();
                return;
            }
        }
    };

    self.DoShowSensorList = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(false);
        self.ShowSensorList(true);
        self.ShowNodeData(false);
    };

    self.DoShowData = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(false);
        self.ShowSensorList(false);
        self.ShowNodeData(true);
    };

    self.DoShowRawSensorData = function () {
        self.ShowRawSensorData(true);
        self.ShowSensorChart(false);
        self.ShowDownloadSensorData(false);
        self.CurrentSensor().GetHistory();
    };

    self.DoShowSensorChart = function () {
        self.ShowRawSensorData(false);
        self.ShowSensorChart(true);
        self.ShowDownloadSensorData(false);
        self.CurrentSensor().GetChart();
    };

    self.DoShowDownloadSensorData = function () {
        self.ShowRawSensorData(false);
        self.ShowSensorChart(false);
        self.ShowDownloadSensorData(true);
        $('#begindate').datepicker({
          format: "yyyy-mm-dd",
          autoclose: true
        });
        $('#enddate').datepicker({
          format: "yyyy-mm-dd",
          autoclose: true
        });
    };

    self.getNodeStatuses( function() {
        self.getNodeRoles( function() {
            var id = Carvic.Utils.GetUrlParam("id");
            if (id) self.LoadNode(id);
            else selg.LoadNode(5);
        });
    });
}

Carvic.Model.NewNodeModel = function () {

    var self = this;

    self.NodeClusterList = ko.observableArray();
    Carvic.Utils.LoadClusterList(self.NodeClusterList);

    self.NodeID = ko.observable("");
    self.NodeName = ko.observable("");
    self.NodeStatus = ko.observable("unknown");
    self.NodeCluster = ko.observable();
    self.NodeLON = ko.observable("");
    self.NodeLAT = ko.observable("");
    self.NodeMachineId = ko.observable("");
    self.Sensors = ko.observableArray();
    self.Components = ko.observableArray();
    self.NodeExtraFields = ko.observableArray();
    self.NodeHistory = ko.observableArray();
    self.NodeComponentToAdd = ko.observable("");
    self.NodeFieldToAdd = ko.observable("");
    self.TemplateName = ko.observable("");
    self.NodeTemplates = ko.observableArray();
    self.CheckedTemplates = ko.observableArray();
    self.TemplateSelection = ko.observable(true);

    //self.NodeStatusesArray = Carvic.Consts.NodeStatusesArray;
    self.NodeStatuses = ko.observableArray();
    self.NodeStatusesMap = {};

    //self.NodeRolesArray = Carvic.Consts.NodeRolesArray;
    self.NodeRoles = ko.observableArray();
    self.NodeRolesMap = {};


    self.getNodeStatuses = function (callback) {
        var d = {}
        self.NodeStatuses.removeAll();
        self.NodeStatusesMap = {};
        Carvic.Utils.Post({ action: "get_all_node_statuses", data: d }, function (data) {
            data.forEach( function (item){
                self.NodeStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.NodeStatusesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.getNodeRoles = function (callback) {
        var d = {}
        self.NodeRoles.removeAll();
        self.NodeRolesMap = {};
        Carvic.Utils.Post({ action: "get_all_node_roles", data: d }, function (data) {
            data.forEach( function (item){
                self.NodeRoles.push({
                    title: item.title,
                    code: item.code
                });
                self.NodeRolesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.RemoveComponent = function (id) {
        self.Components.remove(function (item) {
            return item.Id() == id;
        });
    };
    self.AddNewComponentId = function (id) {
        var obj = {
            Id: ko.observable(id),
            Url: ko.observable("component.html?id=" + encodeURI(id)),
            AlreadyUsed: ko.observable(false),
            RemoveThisComponent: function () { self.RemoveComponent(this.Id()); }
        };
        self.Components.push(obj);
        var req = { action: "check_component_for_multiple_nodes", data: { component: id} };
        Carvic.Utils.Post(req, function (data) {
            if (data.length > 0) {
                obj.AlreadyUsed(true);
            }
        });
    }
    self.AddNewComponent = function () {
        var id = self.NodeComponentToAdd();
        if (id.length > 0) {
            self.AddNewComponentId(id);
            self.NodeComponentToAdd("");
        }
    }

    self.RemoveField = function (id) {
        self.NodeExtraFields.remove(function (item) {
            return item.Id() == id;
        });
    };

    self.AddNewFieldId = function (id) {
        var obj = {
            Id: ko.observable(id),
            Value: ko.observable(),
            AlreadyUsed: ko.observable(false),
            RemoveThisField: function () { self.RemoveField(this.Id()); }
        };
        self.NodeExtraFields.push(obj);
    }
    self.AddNewField = function () {
        var id = self.NodeFieldToAdd();
        if (id.length > 0) {
            self.AddNewFieldId(id);
            self.NodeFieldToAdd("");
        }
    }

    self.DeleteTemplateList = function () {
      switch (self.CheckedTemplates().length > 0) {
        case false:
          alert("There are no nodes chosen to delete!");
          break;
        default:
          if (confirm("You are about to delete:\n" + self.CheckedTemplates() + "\n" + "\n" + "Are you sure you want to delete these nodes?")) {
            for (i in self.CheckedTemplates()) {
              var req = {
                action: "delete_template",
                data: { name: self.CheckedTemplates()[i] }
              };
              Carvic.Utils.Post(req, function (data) {
                  self.LoadNodeTemplates();
                  console.log("Template successfully deleted.")
              });
            }
            self.CheckedTemplates.removeAll();
          }
          break;
      }
    };

    self.ToggleAllTemplates = function () {
        self.CheckedTemplates.removeAll();
        for(i = 0; i < self.NodeTemplates().length; i++) {
            self.CheckedTemplates().push((typeof self.NodeTemplates()[i].Id() != 'string') ? JSON.stringify(self.NodeTemplates()[i].Id()) : self.NodeTemplates()[i].Id());
        }
        return self.CheckedTemplates();
    };

    self.SelectAllTemplates = ko.dependentObservable({
        read: function() {
            return self.CheckedTemplates().length === self.NodeTemplates().length;
        },
        write: function() {
            self.CheckedTemplates(self.CheckedTemplates().length === self.NodeTemplates().length ? [] : self.ToggleAllTemplates());
        },
        owner: self
    });

    self.LoadLastNode = function () {
        var req = { action: "get_last_node" };
        Carvic.Utils.Post(req, function (data) {
            self.NodeName(data.name);
            self.NodeCluster(data.cluster);
        });
    }

    self.LoadNodeTemplates = function () {
        self.NodeTemplates.removeAll();
        self.CheckedTemplates.removeAll();
        var req = { action: "get_node_templates" };
        Carvic.Utils.Post(req, function (data) {
          if (data.length == 0) {
              self.TemplateSelection(false);
          } else {
              self.TemplateSelection(true);
          }
          data.forEach(function(template) {
            var obj = {
                Id: ko.observable(template.name),
                Fields: ko.observableArray(template.extra_fields),
                SelectThisTemplate: function () { self.SelectTemplate(this.Fields()); }
            };
            self.NodeTemplates.push(obj);
          });
        });
    }

    self.SelectTemplate = function (fields) {
        self.NodeExtraFields.removeAll();
        fields.forEach(function (item) {
            self.AddNewFieldId(item);
        });
    };

    self.InsertTemplate = function () {
      var extraFields = [];
      self.NodeExtraFields().forEach(function (item) {
          extraFields.push(item.Id());
      });
      var req = {
          action: "add_node_template",
          data: {
              name: self.TemplateName(),
              extra_fields: extraFields
          }
      };
      Carvic.Utils.Post(req, function (data) {
          //console.log(data);
      });
    };

    self.InsertNode = function () {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NodeName(), "Name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot create new node:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var components = [];
        var error_nodes = 0;
        self.Components().forEach(function (item) {
            if (item.AlreadyUsed()) {
                error_nodes += 1;
            }
            components.push(item.Id());
        });
        if (error_nodes > 0) {
            alert("Some components are already associated with other nodes. Please resolve the conflict.");
            return;
        }

        var extraFields = [];
        self.NodeExtraFields().forEach(function (item) {
            var field = {};
            field[item.Id()] = item.Value();
            extraFields.push(field);
        });

        var req = {
            action: "add_node",
            data: {
                id: self.NodeID(),
                name: self.NodeName(),
                status: self.NodeStatus(),
                cluster: self.NodeCluster(),
                loc_lon: self.NodeLON(),
                loc_lat: self.NodeLAT(),
                machine_id: self.NodeMachineId(),
                extra_fields: extraFields,
                components: components,
                sensors: []
            }
        };
        Carvic.Utils.Post(req, function (data) {
            window.location = "node.html?id=" + encodeURI(data.id);
        });
    };

    self.getNodeStatuses(function() {
        self.getNodeRoles();
    });
}

function ComponentLookup(s, callback) {
    var res = ["a", "b", "c"];
    callback(res);
}

Carvic.Model.NodeSensorModel = function (obj, parent) {

    var self = this;

    self.Parent = parent;
    self.IsActive = ko.observable(false);

    self.ID = obj.id;
    self.Name = ko.observable(obj.name);
    self.Type = ko.observable(obj.type);
    self.Quantity = ko.observable(obj.quantity);
    self.Unit = ko.observable(obj.unit);
    self.History = ko.observableArray();
    self.sensorData = [];
    self.sensorChart = null;
    self.measurementCount = 0;
    self.From = ko.observable("");
    self.To = ko.observable("");
    self.DownloadLimit = ko.observable("");

    self.Show = function () {
        self.Parent.DoShowSensor(self.ID);
    }

    self.GetHistory = function () {
        self.sensorData = [];
        self.History.removeAll();
        var req = {
            action: "get_sensor_history",
            data: {
                sensor: self.ID,
                node: parent.NodeID()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.sensorData.push(obj);
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Value: obj.value
                }));
            }
        });
    };

    self.GetChart = function () {
      self.ClearChart();
      if (self.sensorChart == null) {
        var ctx = document.getElementById("sensorChart").getContext("2d");
        var data = {
        labels: [],
        datasets: [
            {
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: []
            }
        ]};
        self.sensorChart = new Chart(ctx).Line(data);
        for (i = 0; i < self.History().length; i++) {
          self.sensorChart.addData([self.sensorData[i].value], self.sensorData[i].ts);
        }
      }
    };

    self.ClearChart = function () {
      $('#sensorChart').remove();
      $('#chartContainer').append('<canvas class="sensor_chart" id="sensorChart"><canvas>');
      self.measurementCount = 0;
      self.sensorChart = null;
    }

    self.DownloadMeasurements = function() {
        var query = {};
        var d1 = self.From() + "T00:00:00.000Z";
        if (d1 && d1 != "") {
          query.from = d1;
        } else {
          alert("No begin date set!");
          return;
        }
        var d2 = self.To() + "T23:59:59.000Z";
        if (d2 && d2 != "") {
          query.to = d2;
        } else {
          alert("No end date set!");
          return;
        }
        if (self.DownloadLimit() == "") {
          query.limit = 10000;
        } else {
          query.limit = self.DownloadLimit();
        }
        var req = {
            action: "download_measurements",
            data: {
                sensor: self.ID,
                from: query.from,
                to: query.to,
                limit: query.limit
            }
        };
        Carvic.Utils.Post(req, function(data) {
            var blob=new Blob([JSON.stringify(data)]);
            var link=document.createElement('a');
            link.href=window.URL.createObjectURL(blob);
            link.download=self.ID;
            link.click();
        }, function(err) {
            alert("No data!");
        });
    };

    var socket = io.connect('localhost:3000');
    socket.on('measurements', function (data) {
      for (var i = 0; i < data.length; i++) {
        var obj = data[i];
        if (self.ID == obj.sensor) {
          if (self.sensorChart != null) {
            self.sensorChart.addData([obj.value], obj.ts);
            if (self.sensorChart != null && self.measurementCount > 50) {
              self.sensorChart.removeData();
            }
            self.measurementCount++;
          }
          if (self.History().length <= 50) {
            self.History.push(ko.observable({
              Ts: new Date(Date.parse(obj.ts)),
              Value: obj.value
            }));
          }
        }
      }
    });
};

////////////////////////////////////////////////////////////////////
// Model for component search and details

Carvic.Model.ComponentsModel = function () {

    var self = this;

    self.SearchResult = ko.observableArray();
    self.CheckedComponents = ko.observableArray();
    self.CheckedComponentsTypes = ko.observableArray();
    self.SearchType = ko.observable();
    self.SearchProject = ko.observable("");
    self.SearchComment = ko.observable("");
    self.SearchPN = ko.observable("");
    self.SearchSN = ko.observable("");
    self.SearchP = ko.observable("");
    self.SearchS = ko.observable("");
    self.SearchStatus = ko.observable();
    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.EditType = ko.observable("editFalse");
    self.RecCount = ko.observable(0);

    self.PageMode = ko.observable("search"); // values: search, new_batch, edit

    self.NewPN = ko.observable("");
    self.NewP = ko.observable("");
    self.NewS = ko.observable("");
    self.NewSN1 = ko.observable("");
    self.NewSN2 = ko.observable("");
    self.NewType = ko.observable("");

    //self.ComponentTypesArray = Carvic.Consts.ComponentTypesArray;
    self.ComponentTypes = ko.observableArray();
    self.ComponentTypesMap = {};

    //self.ComponentStatusesArray = Carvic.Consts.ComponentStatusesArray;
    self.ComponentStatuses = ko.observableArray();
    self.ComponentStatusesMap = {};

    self.NewCode = ko.observable("");
    self.NewTitle = ko.observable("");

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.getComponentTypes = function (callback) {
        self.ComponentTypes.removeAll();
        self.ComponentTypesMap = {};
        var d = {}
        Carvic.Utils.Post({ action: "get_all_component_types", data: d }, function (data) {
            data.forEach(function (item) {
                self.ComponentTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.ComponentTypesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.getComponentStatuses = function (callback) {
        var d = {}
        self.ComponentStatuses.removeAll();
        self.ComponentStatusesMap = {};
        Carvic.Utils.Post({ action: "get_all_component_statuses", data: d }, function (data) {
            data.forEach( function (item){
                self.ComponentStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.ComponentStatusesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }

    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }
    self.Search = function () {
        self.SearchInner(true);
    }

    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();
        self.CheckedComponents.removeAll();

        var query = { page: self.CurrPage() };
        if (self.SearchType() != undefined) { query.type = self.SearchType(); }
        if (self.SearchPN() != "") { query.product_number = self.SearchPN(); }
        if (self.SearchSN() != "") { query.serial_number = self.SearchSN(); }
        if (self.SearchP() != "") { query.production = self.SearchP(); }
        if (self.SearchS() != "") { query.series = self.SearchS(); }
        if (self.SearchProject() != "") { query.project = self.SearchProject(); }
        if (self.SearchComment() != "") { query.comment = self.SearchComment(); }
        if (self.SearchStatus() != undefined) { query.status = self.SearchStatus(); }

        Carvic.Utils.Post({ action: "get_components2", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();
            for (var i = 0; i < data.records.length; i++) {
                var obj = data.records[i];

                self.SearchResult.push(ko.observable({
                    Type: ko.observable(obj.type),
                    TypeStr: ko.observable(self.ComponentTypesMap[obj.type].title),
                    PN: ko.observable(obj.product_number),
                    Status: ko.observable(obj.status),
                    StatusStr: ko.observable(self.ComponentStatusesMap[obj.status].title),
                    P: ko.observable(obj.production),
                    S: ko.observable(obj.series),
                    SN: ko.observable(obj.serial_number),
                    Project: ko.observable(obj.project),
                    Responsible: ko.observable(obj.responsible),
                    Comment: ko.observable(obj.comment),
                    ID: ko.observable(obj.id)
                }));
            }
        });
    };

    self.ShowDetails = function (curr_component) {
        document.location = "component.html?id=" + encodeURI(curr_component.ID());
    };


    self.EditTypeTitle = function (curr_component) {
        var title = prompt("Enter new type title");
        if( title != null ) {
            var code = curr_component.code;
            var d = {
                code: code,
                title: title
            };
            Carvic.Utils.Post({ action: "update_components_type", data: d }, function (data) {
                self.getComponentTypes();
            });
        }
    };

    self.SaveNewComponents = function (curr_component) {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NewType(), "Type cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewPN(), "Product number cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewP(), "Production date cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewS(), "Series cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewSN1(), "'Serial number from' cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewSN2(), "'Serial number to' cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot create new components:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var d = {
            pn: self.NewPN(),
            type: self.NewType(),
            p: self.NewP(),
            s: self.NewS(),
            sn_from: self.NewSN1(),
            sn_to: self.NewSN2()
        };
        Carvic.Utils.Post({ action: "add_components", data: d }, function (data) {
            self.PageMode("search");
            self.NewPN("");
            self.NewP("");
            self.NewS("");
            self.NewSN1("");
            self.NewSN2("");
            self.NewType("Choose ...");
        });
    };

    self.SaveNewComponentType = function (curr_component){
        var d = {
            code: self.NewCode(),
            title: self.NewTitle()
        };
        Carvic.Utils.Post({ action: "add_new_component_type", data: d }, function (data) {
            self.getComponentTypes();
            self.PageMode("manageType");
            self.NewCode("");
            self.NewTitle("");
        });
    }

    self.ToggleAll = function () {
        self.CheckedComponents.removeAll();
            for(i = 0; i < self.SearchResult().length; i++) {
                self.CheckedComponents().push(self.SearchResult()[i]().ID());
            }
        return self.CheckedComponents();
    };

    self.SelectAll = ko.dependentObservable({
        read: function() {
            return self.CheckedComponents().length === self.SearchResult().length;
        },
        write: function() {
            self.CheckedComponents(self.CheckedComponents().length === self.SearchResult().length ? [] : self.ToggleAll());
        },
        owner: self
    });

    self.ToggleAllTypes = function () {
        self.CheckedComponentsTypes.removeAll();
            for(i = 0; i < self.ComponentTypes().length; i++) {
                self.CheckedComponentsTypes().push(self.ComponentTypes()[i].code);
            }
        return self.CheckedComponentsTypes();
    };

    self.SelectAllTypes = ko.dependentObservable({
        read: function() {
            return self.CheckedComponentsTypes().length === self.ComponentTypes().length;
        },
        write: function() {
            self.CheckedComponentsTypes(self.CheckedComponentsTypes().length === self.ComponentTypes().length ? [] : self.ToggleAllTypes());
        },
        owner: self
    });

    self.StartAddingNewBatch = function () {
        self.PageMode("new_batch");
    }

    self.StartManageTypes = function () {
        self.PageMode("manageType");
    }

    self.StartEditType = function () {
        self.EditType("editTrue");
    }

    self.StartAddingNewType = function () {
        self.PageMode("addType");
    }

    self.CancelAddingNewType = function () {
        self.PageMode("manageType");
        self.NewCode("");
        self.NewTitle("");
    }

    self.CancelManageTypes = function () {
        self.PageMode("new_batch");
        self.CheckedComponentsTypes.removeAll();
    }

    self.CancelAddingNewBatch = function () {
        self.PageMode("search");
        self.NewPN("");
        self.NewP("");
        self.NewS("");
        self.NewSN1("");
        self.NewSN2("");
        self.NewType("");
    }

    self.DeleteComponentList = function () {
        switch (self.CheckedComponents().length > 0) {
            case false:
                alert("There are no components chosen to delete!");
                break;
            default:
                if (confirm("You chose:\n" + self.CheckedComponents() + "\n" + "\n" + "Are you sure you want to delete these components?")) {
                    for (i in self.CheckedComponents()) {
                        var req = {
                            action: "delete_component",
                            data: { id: self.CheckedComponents()[i] }
                        };
                        Carvic.Utils.Post(req, function (data) {
                            //console.log("Deleted component with ID: " + self.CheckedComponents()[i])
                        });
                    }
                    self.CheckedComponents.removeAll();
                    self.SearchResult.removeAll();
                    self.Search();
                }
                break;
        }
    };

    self.DeleteComponentTypesList = function () {
        switch (self.CheckedComponentsTypes().length > 0) {
            case false:
                alert("There are no components chosen to delete!");
                break;
            default:
                if (confirm("You chose:\n" + self.CheckedComponentsTypes() + "\n" + "\n" + "Are you sure you want to delete these components types?")) {
                    for (i in self.CheckedComponentsTypes()) {
                        if(confirm("Some components can use that type:\n" + self.CheckedComponentsTypes()[i] + "\n" + "\n" + "Are you sure you want to delete this type?")) {
                            var req = {
                                action: "delete_component_type",
                                data: { code: self.CheckedComponentsTypes()[i] }
                            };
                            Carvic.Utils.Post(req, function (data) {
                            });
                        }
                    }
                    self.CheckedComponentsTypes.removeAll();
                    self.getComponentTypes();
                }
                break;
        }
    };

    self.getComponentTypes( function() {
        self.getComponentStatuses( function() {
            self.Search();
        });
    });
};

Carvic.Model.ComponentModel = function () {

    var self = this;

    self.Editing = ko.observable(false);

    self.Type = ko.observable("");
    self.TypeStr = ko.observable("");
    self.PN = ko.observable("");
    self.Status = ko.observable();
    self.StatusStr = ko.observable("");
    self.P = ko.observable("");
    self.S = ko.observable();
    self.SN = ko.observable();
    self.Project = ko.observable();
    self.Responsible = ko.observable();
    self.Comment = ko.observable();
    self.ID = ko.observable();
    self.History = ko.observableArray();
    self.Nodes = ko.observableArray();
    self.LastData = {};

    //self.ComponentTypesArray = Carvic.Consts.ComponentTypesArray;
    self.ComponentTypes = ko.observableArray();
    self.ComponentTypesMap = {};

    //self.ComponentStatusesArray = Carvic.Consts.ComponentStatusesArray;
    self.ComponentStatuses = ko.observableArray();
    self.ComponentStatusesMap = {};

    self.Load = function (id) {
        var query = { id: id };
        Carvic.Utils.Post({ action: "get_component", data: query }, function (data) {

            var obj = data;
            self.Type(obj.type);
            self.TypeStr(self.ComponentTypesMap[obj.type].title);
            self.PN(obj.product_number);
            self.Status(obj.status);
            self.StatusStr(self.ComponentStatusesMap[obj.status].title);
            self.P(obj.production);
            self.S(obj.series);
            self.SN(obj.serial_number);
            self.Project(obj.project);
            self.Responsible(obj.responsible);
            self.Comment(obj.comment);
            self.ID(obj.id);
            self.LastData = obj;
            for (var j = 0; j < obj.nodes.length; j++) {
                var node = obj.nodes[j];
                self.Nodes.push({
                    Id: node.id,
                    Name: node.name,
                    Cluster: node.cluster,
                    ClusterName: node.cluster_name,
                    Url: "node.html?id=" + encodeURI(node.id),
                    ClusterUrl: "cluster.html?id=" + encodeURI(node.cluster)
                });
            }


            self.LoadHistory();
        });
    };

    self.LoadHistory = function () {
        self.History.removeAll();
        var req = {
            action: "get_component_history",
            data: { id: self.ID() }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "component_change" ? "icon-edit" : "icon-check")
                }));
            }
        });
    }

    self.getComponentTypes = function (callback) {
        self.ComponentTypes.removeAll();
        self.ComponentTypesMap = {};
        var d = {}
        Carvic.Utils.Post({ action: "get_all_component_types", data: d }, function (data) {
            data.forEach(function (item) {
                self.ComponentTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.ComponentTypesMap[item.code] = item;
            });
            if(callback) callback();
        });
    }

    self.getComponentStatuses = function (callback) {
        var d = {}
        self.ComponentStatuses.removeAll();
        self.ComponentStatusesMap = {};
        Carvic.Utils.Post({ action: "get_all_component_statuses", data: d }, function (data) {
            data.forEach( function (item){
                self.ComponentStatuses.push({
                    title: item.title,
                    code: item.code
                });
                self.ComponentStatusesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.ShowDetails = function (curr_component) {
        self.PageMode("edit");
    };
    self.CancelShowDetails = function (curr_component) {
        self.PageMode("search");
    };

    self.ShowHistory = function (curr_component) { };

    self.SaveComponent = function (curr_component) {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.PN(), "Product number cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.P(), "Production date cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.S(), "Series cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.SN(), "Serial number cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot save component:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var d = { id: self.ID() };
        if (self.LastData.type != self.Type())
            d.type = self.Type();
        if (self.LastData.product_number != self.PN())
            d.product_number = self.PN();
        if (self.LastData.production != self.P())
            d.production = self.P();
        if (self.LastData.series != self.S())
            d.series = self.S();
        if (self.LastData.serial_number != self.SN())
            d.serial_number = self.SN();
        if (self.LastData.status != self.Status())
            d.status = self.Status();
        if (self.LastData.project != self.Project())
            d.project = self.Project();
        if (self.LastData.comment != self.Comment())
            d.comment = self.Comment();

        var req = { action: "update_component", data: d };
        Carvic.Utils.Post(req, function (data) {
            //self.Load(data.id);
            document.location = "component.html?id=" + encodeURI(data.id);
        });
        self.Editing(false);
    };
    self.CancelEditing = function () {
        self.Editing(false);
    }
    self.StartEditing = function () {
        self.Editing(true);
    }

    self.DeleteComponent = function () {
        if (confirm("Are you sure that you want to delete this component?")) {
            var req = {
                action: "delete_component",
                data: { id: self.ID() }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("Component successfully deleted.");
                window.location = "components.html";
            });
        }
    };

    self.getComponentTypes( function() {
        self.getComponentStatuses( function() {
            var id = Carvic.Utils.GetUrlParam("id");
            self.Load(id);
        });
    });
}

////////////////////////////////////////////////////////////////////
// Model for cluster search and details

Carvic.Model.ClustersModel = function () {

    var self = this;

    self.PageMode = ko.observable("search"); // values: search, new
    self.SearchResult = ko.observableArray();
    self.CheckedClusters = ko.observableArray();
    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.SearchTag = ko.observable("");
    self.SearchId = ko.observable("");
    self.SearchName = ko.observable("");
    self.SearchType = ko.observable();

    self.NewTag = ko.observable("");
    self.NewName = ko.observable("");
    self.NewUrl = ko.observable("");
    self.NewType = ko.observable();
    self.NewComment = ko.observable("");

    //self.ClusterTypesArray = Carvic.Consts.ClusterTypesArray;
    self.ClusterTypes = ko.observableArray();
    self.ClusterTypesMap = {};

    self.getClusterTypes = function (callback) {
        var d = {}
        self.ClusterTypes.removeAll();
        self.ClusterTypesMap = {};
        Carvic.Utils.Post({ action: "get_all_cluster_types", data: d }, function (data) {
            data.forEach( function (item){
                self.ClusterTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.ClusterTypesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.Search = function () {
        self.SearchResult.removeAll();
        self.CheckedClusters.removeAll();

        var query = {};
        if (self.SearchTag() != "") query.tag = self.SearchTag();
        if (self.SearchId() != "") query.id = self.SearchId();
        if (self.SearchName() != "") query.name = self.SearchName();
        if (self.SearchType() != null) query.type = self.SearchType();
        Carvic.Utils.Post({ action: "get_clusters", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.SearchResult.push(ko.observable({
                    Id: ko.observable(obj.id),
                    Tag: ko.observable(obj.tag),
                    Name: ko.observable(obj.name),
                    Type: ko.observable(obj.type),
                    TypeStr: ko.observable(self.ClusterTypesMap[obj.type].title),
                    Url: ko.observable(obj.url)
                }));
            }
        });
    };

    self.ShowDetails = function (curr_cluster) {
        document.location = "cluster.html?id=" + encodeURI(curr_cluster.Id());
    };

    self.SaveNewCluster = function (curr_component) {
        var errors = [];
        if (self.NewType() == "zigbee") {
			Carvic.Utils.CheckIfEmpty(self.NewTag(), "Zigbee cluster must have a tag", errors);
		}
        Carvic.Utils.CheckIfEmpty(self.NewName(), "Cluster must have a name", errors);
        if (errors.length > 0) {
            var s = "Cannot save cluster:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var d = {
            name: self.NewName(),
            tag: self.NewTag(),
            type: self.NewType(),
            url: self.NewUrl(),
            comment: self.NewComment(),
            scan: false,
            scheduling: "",
            intervalUnit: "",
            interval: "",
            time: ""
        };
        Carvic.Utils.Post({ action: "add_cluster", data: d }, function (data) {
            self.Search();
            self.PageMode("search");
        });
    };

    self.ScanClusters = function () {
        Carvic.Utils.Post({ action: "scan", data: {} }, function (data) {
            alert("Network scan is running in background.");
        });
    }
    self.StartAddingNew = function () {
        self.PageMode("new");
    }
    self.CancelAddingNew = function () {
        self.PageMode("search");
    }

    self.ToggleAll = function () {
        self.CheckedClusters.removeAll();
            for(i = 0; i < self.SearchResult().length; i++) {
                self.CheckedClusters().push(self.SearchResult()[i]().Id());
            }
        return self.CheckedClusters();
    }

    self.SelectAll = ko.dependentObservable({
        read: function() {
            return self.CheckedClusters().length === self.SearchResult().length;
        },
        write: function() {
            self.CheckedClusters(self.CheckedClusters().length === self.SearchResult().length ? [] : self.ToggleAll());
        },
        owner: self
    })

    self.DeleteClusterList = function () {
        switch (self.CheckedClusters().length > 0) {
                case false:
                    alert("There are no clusters chosen to delete!");
                    break;
                default:
                    if (confirm("You are about to delete:\n" + self.CheckedClusters() + "\n" + "\n" + "Are you sure you want to delete these clusters?")) {
                        for (i in self.CheckedClusters()) {
                            if(confirm("This cluster might contain nodes:\n" + self.CheckedClusters()[i] + "\n" + "\n" + "Are you shure you want to delete this cluster?")) {
                                var req = {
                                    action: "delete_cluster",
                                    data: { id: self.CheckedClusters()[i] }
                                };
                                Carvic.Utils.Post(req, function (data) {
                                    //console.log("Cluster successfully deleted.")
                               });
                            }
                        }
                        self.CheckedClusters.removeAll();
                        self.SearchResult.removeAll();
                        self.Search();
                    }
                    break;
        }
    }
    self.getClusterTypes( function() {
        self.Search();
    });
}

Carvic.Model.ClusterModel = function () {

    var self = this;

    self.Editing = ko.observable(false);
    self.History = ko.observableArray();
    self.Nodes = ko.observableArray();

    self.Type = ko.observable();
    self.TypeStr = ko.observable();

    self.Id = ko.observable();
    self.Tag = ko.observable();
    self.Name = ko.observable();
    self.Url = ko.observable();
    self.ClusterMapUrl = ko.observable("");
    self.Scan = ko.observable(false);
    self.Comment = ko.observable();
    self.LastScan = ko.observable();
    self.LastData = {};
    self.Scheduling = ko.observable("");
    self.IntervalUnit = ko.observable("");
    self.Interval = ko.observable("");
    self.Time = ko.observable("");

    self.ShowNodes = ko.observable(true);
    self.ShowHistory = ko.observable(false);

    //self.ClusterTypesArray = Carvic.Consts.ClusterTypesArray;
    self.ClusterTypes = ko.observableArray();
    self.ClusterTypesMap = {};

    self.DoShowNodes = function () {
        self.ShowHistory(false);
        self.ShowNodes(true);
    }
    self.DoShowHistory = function () {
        self.ShowHistory(true);
        self.ShowNodes(false);
    }

    self.getClusterTypes = function (callback) {
        var d = {}
        self.ClusterTypes.removeAll();
        self.ClusterTypesMap = {};
        Carvic.Utils.Post({ action: "get_all_cluster_types", data: d }, function (data) {
            data.forEach( function (item){
                self.ClusterTypes.push({
                    title: item.title,
                    code: item.code
                });
                self.ClusterTypesMap[item.code] = item;
            });;
            if(callback) callback();
        });
    }

    self.Load = function (id) {
        var query = { id: id };
        Carvic.Utils.Post({ action: "get_cluster", data: query }, function (data) {

            var obj = data;
            self.Type(obj.type);
            self.TypeStr(self.ClusterTypesMap[obj.type].title);
            self.Name(obj.name);
            self.Id(obj.id);
            self.Tag(obj.tag);
            self.Url(obj.url);
            self.ClusterMapUrl("map.html?type=cluster&id=" + encodeURI(obj.id));
            self.Scan(obj.scan);
            self.Comment(obj.comment);
            self.Scheduling(obj.scheduling);
            self.IntervalUnit(obj.intervalUnit);
            self.Interval(obj.interval);
            self.Time(obj.time);
            if (obj.last_scan) {
                self.LastScan(new Date(Date.parse(obj.last_scan)));
            }
            self.LastData = obj;

            self.LoadHistory();
            self.LoadNodes();
        });
    };

    self.LoadNodes = function () {
        // load history
        self.Nodes.removeAll();
        var req = {
            action: "get_nodes",
            data: {
                cluster: self.Id()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.Nodes.push(ko.observable({
                    ID: obj.id,
                    Name: obj.name,
                    Status: ko.observable(obj.status),
                    LON: obj.loc_lon,
                    LAT: obj.loc_lat,
                    MachineId: obj.machine_id,
                    Url: "node.html?id=" + encodeURI(obj.id)
                }));
            }

             //it starts from the page 1
            //ten elements per page
            paginate_nodes(0, 10);

            $('#page-selection-nodes').bootpag({

                total: paginate_nodes(0, 10),
                page: 1,
                maxVisible: 3,
                leaps: true,
                firstLastUse: true,
                first: 'First',
                last: 'Last',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                //$('.history_border').html(); // or some ajax content loading...
                paginate_nodes(num - 1, 10);

            });
        });
    }

    self.LoadHistory = function () {
        // load history
        self.History.removeAll();
        var req = {
            action: "get_cluster_history",
            data: {
                id: self.Id()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "component_change" ? "icon-edit" : "icon-check")
                }));
            }
            //it starts from the page 1
            //ten elements per page
            paginate(0, 10);

            $('#page-selection-history').bootpag({

                total: paginate(0, 10),
                page: 1,
                maxVisible: 3,
                leaps: true,
                firstLastUse: true,
                first: 'First',
                last: 'Last',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                //$('.history_border').html(); // or some ajax content loading...
                paginate(num - 1, 10);

            });
        });
    }

    self.SaveCluster = function (curr_cluster) {
        var errors = [];
        if (self.Type() == "zigbee") {
            Carvic.Utils.CheckIfEmpty(self.Tag(), "Zigbee cluster must have a tag", errors);
        }
        Carvic.Utils.CheckIfEmpty(self.Name(), "Cluster must have a name", errors);
        if (errors.length > 0) {
            var s = "Cannot save cluster:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        if (self.Scan() == true && self.Scheduling() === "")
            return alert("Scheduling cannot be empty");
        if (self.Scan() == true && self.Scheduling() === "recur_scheduling" && self.IntervalUnit() === "")
            return alert("Interval unit cannot be empty");
        if (self.Scan() == true && self.Scheduling() === "recur_scheduling" && self.IntervalUnit() !== "" && self.Interval() === "")
            return alert("Interval cannot be empty");
        if (self.Scan() == true && self.Scheduling() === "time_scheduling" && self.Time() === "")
            return alert("Exact time cannot be empty");
        if (self.Scan() == true && self.Scheduling() === "recur_scheduling"){
            if (parseInt(self.Interval()) < 1)
                return alert("Interval must be higher then 0");
            var reg = new RegExp('^\\d+$');
            if (!reg.test(self.Interval()))
                return alert("Insert numbers only");
        }

        var d = { id: self.LastData.id };
        var agendaChange = false;
        if(self.LastData.scan != self.Scan() || self.LastData.scheduling != self.Scheduling() || self.LastData.interval != self.Interval()
        || self.LastData.time != self.Time() || self.LastData.intervalUnit != self.IntervalUnit())
            agendaChange = true;

        if (self.LastData.type != self.Type())
            d.type = self.Type();
        if (self.LastData.tag != self.Tag())
            d.tag = self.Tag();
        if (self.LastData.name != self.Name())
            d.name = self.Name();
        if (self.LastData.url != self.Url())
            d.url = self.Url();
        if (self.LastData.scan != self.Scan())
            d.scan = self.Scan();
        if (self.LastData.comment != self.Comment())
            d.comment = self.Comment();
        if (self.LastData.scheduling != self.Scheduling())
            d.scheduling = self.Scheduling();
        if (self.LastData.interval != self.Interval())
            d.interval = self.Interval();
        if (self.LastData.time != self.Time())
            d.time = self.Time();
        if (self.LastData.intervalUnit != self.IntervalUnit())
            d.intervalUnit = self.IntervalUnit();
        var req = { action: "update_cluster", data: d };
        Carvic.Utils.Post(req, function (data) {
            if(agendaChange){
                var req1 = { action: "update_agenda", data: d };
                Carvic.Utils.Post(req1, function (data) {
                    var id = Carvic.Utils.GetUrlParam("id");
                    Carvic.Model.Cluster.Load(id);
                    self.Editing(false);
                });
            }
            else {
                var id = Carvic.Utils.GetUrlParam("id");
                Carvic.Model.Cluster.Load(id);
                self.Editing(false);
            }
        });
    };
    self.CancelEditing = function () {
        self.Editing(false);
    }
    self.StartEditing = function () {
        self.Editing(true);
    }
    self.ScanCluster = function () {
        Carvic.Utils.Post({ action: "scan", data: { id: self.Id()} }, function (data) {
            alert("Network scan is running in background.");
        });
    }
    self.DeleteCluster = function () {
        if (self.Nodes().length > 0) {
            alert("Cannot delete cluster - nodes are assigned to it.");
            return;
        }
        if (!confirm("Are you sure that you want to delete this cluster?")) return;

        var req = {
            action: "delete_cluster",
            data: { id: self.Id() }
        };
        Carvic.Utils.Post(req, function (data) {
            alert("Cluster successfully deleted.");
            window.location = "clusters.html";
        });
    };

    self.getClusterTypes( function() {
        var id = Carvic.Utils.GetUrlParam("id");
        self.Load(id);
    });
}

////////////////////////////////////////////////////////////////////
// Model for cluster search and details

Carvic.Model.HistoryModel = function () {

    var self = this;

    self.SearchResult = ko.observableArray();

    self.User = ko.observable("");
    self.UserList = ko.observableArray();
    self.Component = ko.observable("");
    self.Node = ko.observable("");
    self.Type = ko.observable("");
    self.Cluster = ko.observable("");
    self.ClusterList = ko.observableArray();
    self.Keywords = ko.observable("");

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.RecCount = ko.observable(0);

    self.From = ko.observable("");
    self.To = ko.observable("");

    Carvic.Utils.LoadClusterList(self.ClusterList);
    Carvic.Utils.LoadUserList(self.UserList);

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }

    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }
    self.Search = function () {
        self.SearchInner(true);
    }
    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();
        var query = { page: self.CurrPage() };

        if (self.User() != "") query.user = self.User();
        if (self.Component() != "") query.component = self.Component();
        if (self.Node() != "") query.node = Number(self.Node());
        if (self.Cluster() != "") query.cluster = self.Cluster();
        if (self.Keywords() != "") query.keywords = self.Keywords();
        if (self.Type() != "") query.type = self.Type();
        var d1 = self.From();
        if (d1 && d1 != "") query.ts_from = Carvic.Utils.ParseDate(d1);
        var d2 = self.To();
        if (d2 && d2 != "") query.ts_to = Carvic.Utils.ParseDate(d2);

        Carvic.Utils.Post({ action: "get_history", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();
            for (var i = 0; i < data.records.length; i++) {
                var obj = data.records[i];
                obj.component = obj.component || "";
                obj.type = obj.type || "";
                obj.component_url = (obj.component ? "component.html?id=" + encodeURI(obj.component) : null);
                obj.cluster = obj.cluster || "";
                obj.cluster_name = obj.cluster_name || "";
                obj.cluster_url = (obj.cluster ? "cluster.html?id=" + encodeURI(obj.cluster) : null);
                obj.node = obj.node || "";
                obj.node_url = (obj.node ? "node.html?id=" + encodeURI(obj.node) : null);
                obj.ts = new Date(obj.ts);
                self.SearchResult.push(ko.observable(obj));
            }
        });
    };

    self.Search();
}

////////////////////////////////////////////////////////////////////
// Model for personal settings

Carvic.Model.SettingsModel = function () {

    var self = this;

    self.CurrentFullName = ko.observable("");
    self.NewPwd1 = ko.observable("");
    self.NewPwd2 = ko.observable("");
    self.Msg = ko.observable("");
    self.MsgType = ko.observable("");
    self.APIToken = ko.observable("");

    self.SaveNewFullName = function () {
        var query = {
            full_name: self.CurrentFullName()
        };
        Carvic.Utils.Post({ action: "change_my_full_name", data: query }, function (data) {
            alert("Full name changed successfully");
        });
    };

    self.ChangePassword = function () {
        var query = {
            pwd1: self.NewPwd1(),
            pwd2: self.NewPwd2()
        };
        Carvic.Utils.Post({ action: "change_pwd", data: query }, function (data) {
            alert("Password changed successfully");
            document.form.pwd1.value = "";
            document.form.pwd2.value = "";
        });
    };

    /*self.GetToken = function (username) {
        var query = { username: username };
        Carvic.Utils.Post({ action: "get_users_token", data: query}, function(data) {
            self.APIToken = data;
            return self.APIToken;
        });
    }*/
}

////////////////////////////////////////////////////////////////////////////////////////////////

Carvic.Model.Refresh = function () {

}

Carvic.ReloadStats = function () {
    var req1 = { action: "get_node_stats" };
    Carvic.Utils.Post(req1, function (data) {
        Carvic.Model.Stats().Nodes().all(data.all);
        Carvic.Model.Stats().Nodes().active(data.active);
        Carvic.Model.Stats().Nodes().active_percent(data.active_percent);
    });
    var req2 = { action: "get_sensor_stats" };
    Carvic.Utils.Post(req2, function (data) {
        Carvic.Model.Stats().Sensors().all(data.all);
        Carvic.Model.Stats().Sensors().active(data.active);
        Carvic.Model.Stats().Sensors().active_percent(data.active_percent);
    });
    var req3 = { action: "get_user_stats" };
    Carvic.Utils.Post(req3, function (data) {
        Carvic.Model.Stats().Users().all(data.all);
        Carvic.Model.Stats().Users().active(data.active);
        Carvic.Model.Stats().Users().admins(data.admins);
    });

    var req4 = { action: "get_cluster_stats" };
    Carvic.Utils.Post(req4, function (data) {
        for (var i in data) {
            var obj = data[i];
            obj.url = "cluster.html?id=" + encodeURI(obj.id);
            obj.nodes_activep = Math.round(100 * obj.nodes_activep) / 100;
            obj.sensors_activep = Math.round(100 * obj.sensors_activep) / 100;
            Carvic.Model.Stats().Clusters.push(obj);
        }
    });
}

/////////////////////////////////////////////////////////////////////

Carvic.InitAdminPage = function () {
    Carvic.Model.Admin = {};
    Carvic.Utils.SetCurrentUser(Carvic.Model.Admin);
}

Carvic.InitUserList = function () {
    Carvic.Model.Users = new Carvic.Model.UsersModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Users);
}

Carvic.InitSingleUser = function () {
     Carvic.Model.User = new Carvic.Model.UserModel();
     Carvic.Utils.SetCurrentUser(Carvic.Model.User);
 }

Carvic.InitComponentList = function () {
    Carvic.Model.Components = new Carvic.Model.ComponentsModel();
    //Carvic.Model.Components.Search(); // this is too expensive
    Carvic.Utils.SetCurrentUser(Carvic.Model.Components);
}
Carvic.InitHistoryList = function () {
    Carvic.Model.History = new Carvic.Model.HistoryModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.History);
}

Carvic.InitSingleComponentList = function () {
    Carvic.Model.Component = new Carvic.Model.ComponentModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Component);
}

Carvic.InitClusterList = function () {
    Carvic.Model.Clusters = new Carvic.Model.ClustersModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Clusters);
}

Carvic.InitSingleCluster = function () {
    Carvic.Model.Cluster = new Carvic.Model.ClusterModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Cluster);
}

Carvic.InitNodeList = function (callback) {
    Carvic.Model.Nodes = new Carvic.Model.NodesModel(callback);
    Carvic.Utils.SetCurrentUser(Carvic.Model.Nodes);
}

Carvic.InitSingleNode = function () {
    Carvic.Model.SingleNode = new Carvic.Model.SingleNodeModel();
    var id = Carvic.Utils.GetUrlParam("id");
    if (id)
        Carvic.Model.SingleNode.LoadNode(id);
    else
        Carvic.Model.SingleNode.LoadNode(5);
    Carvic.Utils.SetCurrentUser(Carvic.Model.SingleNode);
}

Carvic.InitNewNode = function () {
    Carvic.Model.NewNode = new Carvic.Model.NewNodeModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.NewNode);
}

Carvic.InitStats = function () {
    Carvic.Model.Stats = ko.observable({
        Nodes: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            active_percent: ko.observable()
        }),
        Sensors: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            active_percent: ko.observable()
        }),
        Users: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            admins: ko.observable()
        }),
        Clusters: ko.observableArray()
    });
    Carvic.Utils.SetCurrentUser(Carvic.Model.Stats());
    Carvic.ReloadStats();
}

Carvic.InitSettings = function () {
    Carvic.Model.Settings = new Carvic.Model.SettingsModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Settings, function () {
        Carvic.Model.Settings.CurrentFullName(Carvic.Model.Settings.StdData.CurrentUserFullname());
        Carvic.Model.Settings.APIToken(Carvic.Model.Settings.StdData.CurrentUserToken());
    });
}
