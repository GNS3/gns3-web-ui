import React, { Component } from "react";
import { FunctionComponent, useEffect, useRef, useState } from 'react';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/CardGroup';

const apiUrl = 'https://api.github.com/repos/GNS3/gns3-web-ui/issues';

class IssueListComponent extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: false,
            issues: []
        };
    }

    componentDidMount() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => this.setState({ issues: data }));
    }

    render() {
        const { issues } = this.state;
     
        return (
          <div style={{ justifyContent: 'center', display: 'flex', flex: 1, flexDirection: 'row', flexWrap: 'wrap',  margin: '20px;' }}>
            {issues.map(issue =>
                <Card key={issue.title} style={{ width: '300px', margin: '20px' }}>
                    <Card.Body>
                        <Card.Title style={{ color: 'black' }}>{issue.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Status: {issue.state}</Card.Subtitle>
                        <Card.Text style={{ color: 'black', overflowY: 'auto', height: '100px' }}>
                            {issue.body}
                        </Card.Text>
                        <Card.Link href={issue.html_url} target = "_blank">{issue.html_url}</Card.Link>
                    </Card.Body>
                </Card>
            )}
          </div>
        );
    }
};

export default IssueListComponent;