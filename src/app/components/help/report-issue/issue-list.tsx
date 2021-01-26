import React, { Component } from "react";
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import IssueComponent from './issue';
import FilterComponent from './filter';

const wrapperStyle = { 
    justifyContent: 'center', 
    display: 'flex', 
    flex: 1, 
    flexDirection: 'row', 
    flexWrap: 'wrap',  
    margin: '20px' 
};

const cardStyle = { 
    width: '300px', 
    margin: '20px' 
};

const cardTitleStyle = { 
    color: 'red' 
};

const apiUrl = 'https://api.github.com/repos/GNS3/gns3-web-ui/issues';
const newIssueLink = 'https://github.com/GNS3/gns3-web-ui/issues/new';

class IssueListComponent extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            issues: [],
            filteredIssues: [],
            isFetching: true
        };
    }

    componentDidMount() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => this.setState({ 
                issues: data, 
                filteredIssues: data,
                isFetching: false 
            }));
    }

    handleChange = (e) => {
        let filter = e.target.value;
        let filteredIssues = this.state.issues;

        filteredIssues = filteredIssues.filter((issue) => {
            return issue.title.toLowerCase().includes(filter.toLowerCase())
        });

        this.setState({
            filteredIssues: filteredIssues
        });
    }

    render() {
        return (
            <div>
                <div>
                    <FilterComponent handleChange={this.handleChange} filter={this.state.filter} />
                </div>
                
                {this.state.isFetching ? (
                    <div style={wrapperStyle}>
                        <Spinner animation="grow" />
                    </div>
                ) : (
                    <div style={wrapperStyle}>
                    {this.state.filteredIssues.map(issue =>
                        <IssueComponent key={issue.html_url} data={issue}/>
                    )}
                    <Card style={cardStyle}>
                        <Card.Body>
                            <Card.Title style={cardTitleStyle}>Don't see your issue here?</Card.Title>
                            <Card.Link href={newIssueLink} target = "_blank">Open new issue</Card.Link>
                        </Card.Body>
                    </Card>
                    </div>
                )}
            </div>
        );
    }
};

export default IssueListComponent;