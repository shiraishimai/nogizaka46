'use strict';
const PAGE_SIZE = 100;
var React = require('react');

let ImageComponent = React.createClass({
    render() {
        let path = 'img/'+this.props.src;
        return <div className="nogi-popup"><img className="img-thumbnail" src={path} /></div>;
    }
});

let Column = React.createClass({
    render() {
        let imageComponents = this.props.data.map((item) => {
            // return React.DOM.div({key: item}, item);
            return <ImageComponent src={item} key={item} />;
        });
        return <div className="col-md-2">{imageComponents}</div>;
    }
});

module.exports = React.createClass({
    getInitialState() {
        console.log("[ImageList getInitialState]");
        this.items = this.props.list;
        this.page = 1;
        return {
            columns: this._getColumns()
        };
    },
    _getColumns() {
        let columns = [[], [], [], [], [], []];
        this.items.slice((this.page-1)*PAGE_SIZE, this.page*PAGE_SIZE).forEach((item, index) => {
            columns[index%6].push(item);
        });
        return columns;
    },
    setPage(pageNumber) {
        this.page = pageNumber;
        this.setState({columns: this._getColumns()});
    },
    componentDidMount() {
        console.log("[ImageList componentDidMount]");
    },
    render() {
        console.log("[ImageList render]");
        // return React.DOM.div(null, 
        //     React.DOM.ul({
        //         children: this.state.items.map((item) => {
        //             return React.DOM.li(null, item);
        //         })  
        //     })
        // );
        // return React.DOM.div({className: "main"}, 
        //     // React.DOM.div({className: "container"},
        //     //     React.DOM.h2(null, "Testing")
        //     // ) 
        //     React.DOM.div({
        //         className: "container",
        //         children: this.state.columns.map((column) => {
        //             return <Column data={column} />;
        //         })
        //     })
        // );
        let columns = this.state.columns.map((column) => {
            return <Column data={column} key={column} />;
        });
        return <div className="main">
            <div className="container">
                {columns}
            </div>
        </div>;
    }
});