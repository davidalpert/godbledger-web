class LineItem {
    constructor() {
      this._date = moment().format();
      this._description = "";
      this._currency= window.user.defaultcurrency;
      this._account = "";
      this._amount = 0;
    }

    set amount(amount) {
      this._amount = amount;
    }
    get amount() {
      return this._amount;
    }

    set account(account) {
      this._account = account;
    }
    get account() {
      return this._account;
    }

    set description(description) {
      this._description = description;
    }
    get description() {
      return this._description;
    }

    set date(date) {
        this._date = moment(date).format();
    }
    get date() {
        return this._date;
    }

    isEmpty() {
			return ((!this._account || 0 === this._account.length) || !this._account.trim()) && (!this._amount || this._amount === 0);
    }
}
class Journal {
    constructor() {
      this._date = moment().format();
      this.id = "";
      this._narration = "Display Me";
      this._lineitems = [];
      this._lineItemCount = 0;

      var i;
      for (i = 0; i < 3; i++) {
        this.addNewLineItem();
      } 
    }

    setID(journalID) {
      this.id += journalID;
    }

    addNewLineItem() {
      this._lineItemCount += 1;
      addLineItem(this._lineItemCount);
    }

    save(journalForm) {

      var lineitemKeys = Object.keys(journalForm).filter(function(name) {
        return name.includes("line-item");
      });
      var journalDate = moment(journalForm.date, "YYYY-MM-DD").format();
      var i = 0;
      for (i = 0; i < lineitemKeys.length; i++) {
        if (lineitemKeys[i].includes("[")){
          var separators = ['\\\[', '\\\]'];
          var tokens = lineitemKeys[i].split(new RegExp(separators.join('|'), 'g'));
          var filtered = tokens.filter(function (el) {
            return el != "";
          });
          if (this._lineitems[parseInt(filtered[1], 10)] != undefined) {
            var lineitem = this._lineitems[parseInt(filtered[1], 10)];
          } else {
            var lineitem = new LineItem();
            lineitem._date = journalDate;
          }
          switch(filtered[2]) {
            case "narration":
              lineitem._description = journalForm[lineitemKeys[i]];
              break;
            case "account":
              lineitem._account = $(`select[name ="${lineitemKeys[i]}"]`).text();
              break;
            case "debit":
              if (lineitem._amount == 0 && journalForm[lineitemKeys[i]]) {
                lineitem._amount = parseFloat(journalForm[lineitemKeys[i]],10).toFixed(2) * 1;
              }
              break;
            case "credit":
              if (lineitem._amount == 0 && journalForm[lineitemKeys[i]]) {
                lineitem._amount = parseFloat(journalForm[lineitemKeys[i]],10).toFixed(2) * -1;
              }
              break;
            default:
              console.log("could not identify" + lineitemKeys[i])
          }

          this._lineitems[parseFloat(filtered[1], 10)] = lineitem;
        }
      }
      this._narration = journalForm.narration;
      this._lineitems.splice(0, 1);
      this._lineitems = this._lineitems.filter(function (el) {
        return !el.isEmpty();
      });
      this._date = journalDate;
      this._lineItemCount = this._lineitems.length;
      window.transactions.unshift({"id":"","_date":this._date,"_description":this._narration,"_amount":Math.abs(this._lineitems[0]._amount).toFixed(2)})
      if(this.id == "")
      {
        $.ajax({
            type: 'POST',
            url: '/api/journals',
            data: JSON.stringify(this,
              function(k, v) {
                if (k === '_amount') {
                  return v.toString();
                }
                return v;
              }
            ),
            success: function(data) {},
            contentType: "application/json",
            dataType: 'json'
        });
      } else {
        $.ajax({
            type: 'POST',
            url: '/api/journals/'+this.id,
            data: JSON.stringify(this,
              function(k, v) {
                if (k === '_amount') {
                  return v.toString();
                }
                return v;
              }
            ),
            success: function(data) {},
            contentType: "application/json",
            dataType: 'json'
        });
      }
    }
}

var journal = new Journal();

// ...and hook up the add new line item button
var newLineItemButton = document.getElementById("addNewLineItemButton");
if (newLineItemButton.addEventListener) {
    newLineItemButton.addEventListener('click', function(e) {
        e.preventDefault();
        journal.addNewLineItem();
    }, false);
}
else if (newLineItemButton.attachEvent) {
    newLineItemButton.attachEvent('onclick', function(e) {
        e.preventDefault();
        journal.addNewLineItem();
    });
}
else {
    // Very old browser, complain
}

$(document).ready(function() {
    $('.js-example-basic-single').select2({
      theme: "bootstrap",
      placeholder: "Select Account",
      ajax: {
        url: '/api/accounts',
        dataType: 'json',
      }
    });
});

$('input[name="date"]').on("blur", function(){
  dt = Date.create($(this).val()).format('{yyyy}-{MM}-{dd}')
  $(this).val(dt)
});

$('#addJournal').on('submit', function (e) {
  if (e.isDefaultPrevented()) {
    // handle the invalid form...
  } else {
    e.preventDefault();
    

    window.journal.save($('#addJournal').serializeObject());
    $('#addJournal')[0].reset();
    tableCreate();
    clearJournalDateDescription();
    clearJournalLineItems();
    journal = new Journal();
    $('#journalModal').modal('toggle');
  }
})

const refreshButton = document.getElementById('refresh');

refreshButton.addEventListener('click', async _ => {
  try {
    fetch('/api/journals/')
    .then(response => response.json())
    .then(data => {
      window.transactions = data.Journals;
      tableCreate()
    })
    .catch(error => console.error(error))
} catch { error => console.error(error)
}});

function getJournal(index) {  
  try {
    fetch('/api/journals/'+index)
    .then(response => response.json())
    .then(data => {
      window.journal = data;
      for (var key in journal) {
        try {
          document.getElementById("addJournal").elements[key].value = journal[key]
        } catch(err){
          console.log(err)
        }
      }
      $("#journalModal").modal() 
    })
    .catch(error => console.error(error))
  } catch { error => console.error(error)
  }
}

function editJournal(index,id) {  
  try {
    fetch('/api/journals/'+id)
    .then(response => response.json())
    .then(data => {
      $('#addJournal')[0].reset();
      journal = new Journal();
      clearJournalDateDescription();
      clearJournalLineItems();
      journal._lineItemCount = 0;
      journal.setID(id);
      document.getElementsByName("date")[0].value = formatformaldate(data._date);
      document.getElementsByName("narration")[0].value = data._narration;
      for (var lineItem in data._lineItems) {
        journal.addNewLineItem();
        document.getElementsByName("line-item[" +(journal._lineItemCount)+ "][narration]")[0].value = data._lineItems[lineItem]._description;
        var amount = parseInt(data._lineItems[lineItem]._amount);
        if (amount > 0) {
          document.getElementsByName("line-item[" +journal._lineItemCount+ "][debit]")[0].value = amount;
        } else {
          document.getElementsByName("line-item[" +journal._lineItemCount+ "][credit]")[0].value = -amount;
        }
        var account = data._lineItems[lineItem]._account;
        var accountSelect = $(`select[name ="line-item[${journal._lineItemCount}][account]"]`);
        var option = new Option(account, '0', true, true);
        accountSelect.append(option).trigger('change');
      }
      updateTotal();
      $("#journalModal").modal() 
    })
    .catch(error => console.error(error))
  } catch { error => console.error(error)
  }

}

function deleteJournal(index) {
  $.ajax({
      type: 'DELETE',
      url: `/api/journals/${index}`,
      success: function(data) {
        window.transactions.splice(index, 1);
        tableCreate();
      },
  });
}

function clearJournalDateDescription() {
  $('input[name=date').val('');
  $('input[name=narration').val('');
}

function clearJournalLineItems() {
  var rows = $('#journal > tr');
  rows.each(function(idx, li) {
    var lineItem = $(li);
    lineItem.remove();
  });
}

function stripwhitecommas(str) {
  if (!str || 0 === str.length) {
    return str
  } else {
    return str.toString().replace(/[\s,]+/g,'').trim(); 
  }
}

function stripCents(str) {
  if (!str || 0 === str.length) {
    return str
  } else {
    if (str.indexOf('.') !== -1) {
      str = str.substring(0, str.indexOf('.'));
    }
    //return str.replace(/[^0-9,]|,[0-9]*$/,''); 
    return str.replace("/[^\d]/",""); 
  }
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function makeJSON() {
  window.JSONFile = {Transactions: window.transactions};
  var text = JSON.stringify(window.JSONFile, null, '\t');
  download("transactions.json", text);
}

function addLineItem(index) {
  var tbdy = document.getElementById('journal');
  var tr = document.createElement('tr');
  var td = document.createElement('td');

  //ID of the Journal
  td.appendChild(document.createTextNode(index));
  tr.appendChild(td);

  //Input for Narration of line item
  var td = document.createElement('td');
  var input  = document.createElement('input');
  input.className = 'form-control';
  input.setAttribute('data-lpignore', "true");
  input.name = `line-item[${index}][narration]`;
  input.type = "text";
  input.setAttribute('tabindex', index*4+3);
  td.appendChild(input);
  tr.appendChild(td);

  //Select element for Account of line item
  var td = document.createElement('td');
  var select = document.createElement('select');
  select.className = 'js-example-basic-single form-control';
  select.name = `line-item[${index}][account]`;
  select.setAttribute('tabindex', index*4+4);
  td.appendChild(select);
  tr.appendChild(td);

  //Input for Debit Amount of line item
  var td = document.createElement('td');
  var input  = document.createElement('input');
  input.className = 'form-control money';
  input.setAttribute('data-lpignore', "true");
  input.name = `line-item[${index}][debit]`;
  input.type = "number";
  input.setAttribute("onchange", `document.getElementsByName("line-item[${index}][credit]")[0].value="";updateTotal();`);;
  input.setAttribute("min", 0);;
  input.setAttribute("step", 0.01);;
  input.setAttribute('tabindex', index*4+5);
  td.appendChild(input);
  tr.appendChild(td);

  //Input for Credit Amount of line item
  var td = document.createElement('td');
  var input  = document.createElement('input');
  input.className = 'form-control money';
  input.setAttribute('data-lpignore', "true");
  input.name = `line-item[${index}][credit]`;
  input.type = "number";
  input.setAttribute("onchange", `document.getElementsByName("line-item[${index}][debit]")[0].value="";updateTotal();`);;
  input.setAttribute("min", 0);;
  input.setAttribute('tabindex', index*4+6);
  input.setAttribute("step", 0.01);;
  td.appendChild(input);
  tr.appendChild(td);

  //Append the Row to the Table
  tbdy.appendChild(tr);

  $(`select[name ="line-item[${index}][account]"]`).select2({
    theme: "bootstrap",
    placeholder: "Select Account",
    ajax: {
      url: '/api/accounts',
      dataType: 'json',
    }
  }).on("change",function(){
    updateTotal()
  });
}

function updateTotal()
{
  $('#saveJournalButton').prop('disabled', false);
  var DRTotal = 0;
  var CRTotal = 0;

  for (var i = 1; i <= journal._lineItemCount; i++) {
    var DRAmount = parseFloat(document.getElementsByName(`line-item[${i}][debit]`)[0].value);
    if (!isNaN(DRAmount) && DRAmount >=0) { 
      DRTotal += DRAmount; 
      $(`input[name ="line-item[${i}][debit]"]`).val(DRAmount.toFixed(2))
              
      if (!$(`select[name ="line-item[${i}][account]"]`).text()) {
        $('#saveJournalButton').prop('disabled', true);
      }
    } else if (document.getElementsByName(`line-item[${i}][debit]`)[0].value) {
      $('#saveJournalButton').prop('disabled', true);
    } else {
      var CRAmount = parseFloat(document.getElementsByName(`line-item[${i}][credit]`)[0].value);
      if (!isNaN(CRAmount) && CRAmount >=0) { 
        CRTotal += CRAmount; 
      $(`input[name ="line-item[${i}][credit]"]`).val(CRAmount.toFixed(2))
        if (!$(`select[name ="line-item[${i}][account]"]`).text()) {
          $('#saveJournalButton').prop('disabled', true);
        }
      } else if (document.getElementsByName(`line-item[${i}][credit]`)[0].value) {
        $('#saveJournalButton').prop('disabled', true);
      }
    }
  }

  if ((Math.abs(DRTotal - CRTotal) >= 0.01) && (DRTotal > 0)) {
    $('#saveJournalButton').prop('disabled', true);
  }

  document.getElementById('invoiceTotalDebit').value = DRTotal.toFixed(2);
  document.getElementById('invoiceTotalCredit').value = CRTotal.toFixed(2);
}

function tableCreate() {
  var tbdy = document.getElementById('transactionstable');
  tbdy.innerHTML = '';
  for (var i = 0; i < window.transactions.length; i++) {
    // Date
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.className = 'txntable';
    td.appendChild(document.createTextNode(formatdate(window.transactions[i]._date)))
    tr.appendChild(td)

    // Journal ID
    var td = document.createElement('td');
    td.className = 'txntable';
    var span = document.createElement('span');
    span.appendChild(document.createTextNode(truncate(window.transactions[i].id,12)))
    span.title=window.transactions[i].id;
    td.appendChild(span)

    // Journal ID copy to clipboard
    var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute('viewBox',"0 0 16 16");
    svg.setAttribute('width',"16");
    svg.setAttribute("height","16");
    var path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("fill-rule","evenodd");
    path.setAttribute("d","M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z");
    var btn = document.createElement('button');
    btn.title=window.transactions[i].id;

    btn.setAttribute('data-param',window.transactions[i].id);
    btn.className = 'clipboard btn btn-sm btn-light';
    btn.onclick = function () {copyToClipboard(this.getAttribute('data-param'));}; 
    svg.appendChild(path);
    btn.appendChild(svg);
    if (window.transactions[i].id.length > 0){
      td.appendChild(btn);
    }
    tr.appendChild(td);

    // Narration
    var td = document.createElement('td');
    td.className = 'txntable';
    td.appendChild(document.createTextNode(window.transactions[i]._description))
    tr.appendChild(td)

    // Amount
    var td = document.createElement('td');
    td.className = 'txntable';
    var amount = document.createTextNode("$" + moneyNumber(window.transactions[i]._amount))
    td.appendChild(amount);
    td.className = 'txntable dollaramount';
    tr.appendChild(td)

    // Edit button
    var td = document.createElement('td');
    var btn = document.createElement('button');
    btn.className = 'btn btn-warning btn-rounded btn-sm';
    btn.setAttribute('data-param-index', i);
    btn.setAttribute('data-param-id',window.transactions[i].id);
    btn.onclick = function () {editJournal(this.getAttribute('data-param-index'),this.getAttribute('data-param-id'));}; 
    btn.innerHTML = "Edit";
    if (window.transactions[i].id.length > 0){
      td.appendChild(btn)
    }
    tr.appendChild(td)

    // Delete button
    var td = document.createElement('td');
    var btn = document.createElement('button');
    btn.className = 'btn btn-danger btn-rounded btn-sm';
    btn.setAttribute('data-param', i);
    btn.setAttribute('data-id', window.transactions[i].id);
    btn.onclick = function () {deleteJournal(this.getAttribute('data-id'));}; 
    btn.innerHTML = "Delete";
    if (window.transactions[i].id.length > 0){
      td.appendChild(btn)
    }
    tr.appendChild(td)
    tbdy.appendChild(tr);
  }
}

$('#journalModal').on('shown.bs.modal', function () {
  $('input[name=date').trigger('focus');
})

$('#journalModal').on('hidden.bs.modal', function () {
  clearJournalDateDescription();
  clearJournalLineItems();
  journal = new Journal();
  $('#addJournal')[0].reset();
  updateTotal()
  $('#saveJournalButton').prop('disabled', true);
  window.now = moment();
})

function formatcomma(element) {
  return element.toString().replace(/ /g,'').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

var truncate = function (fullStr, strLen, separator) {
    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
           separator +
           fullStr.substr(fullStr.length - backChars);
};

function formatdate(element) {
  return moment(element).format('Do MMMM YYYY');
}
function formatformaldate(element) {
  return moment(element).format('YYYY-MM-DD');
}
function moneyNumber(x, decimals = 0) {
  xstr = x.toString();
  truncstr = xstr.substring(0, xstr.length - decimals);
  truncstrcomma = truncstr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimals > 0) {
      truncstrcomma = truncstrcomma + "."+xstr.substring(xstr.length - decimals, xstr.length);
  }
  return truncstrcomma;
}

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = "";
            }
            if ($(this).is("select")) {
              o[this.name] = $(this).find(':selected').text() || '';
            } else {
              o[this.name] = this.value || '';
            }
        } else {
            if ($(this).is("select")) {
              o[this.name] = $(this).find(':selected').text() || '';
            } else {
              o[this.name] = this.value || '';
            }
        }
    });
    return o;
};

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
};

function main() {
  $('#addJournal')[0].reset();
  updateTotal()
  $('#saveJournalButton').prop('disabled', true);
  window.transactions = [];
  window.now = moment();
  try {
    fetch('/api/journals/')
    .then(response => response.json())
    .then(data => {
      window.transactions = data.Journals;
      tableCreate()
    })
    .catch(error => console.error(error))
  } catch { error => console.error(error) }
}
main();
